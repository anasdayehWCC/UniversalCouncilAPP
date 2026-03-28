/**
 * Workflow Integration Tests
 *
 * Tests for the approval workflow state machine including state transitions,
 * permission checks, and audit trail functionality.
 *
 * @module tests/integration/workflow
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  WorkflowStateMachine,
  createInitialWorkflowState,
  checkSlaBreach,
  getTimeUntilSlaBreach,
  getWorkflowSummary,
} from '@/lib/workflow/state-machine';
import type {
  WorkflowState,
  WorkflowStep,
  WorkflowAction,
  WorkflowActor,
  WorkflowHistoryEntry,
} from '@/lib/workflow/types';
import { WORKFLOW_STEP_CONFIG, WORKFLOW_ACTION_CONFIG, WORKFLOW_TRANSITIONS } from '@/lib/workflow/types';
import type { ServiceDomain } from '@/config/domains';

// ============================================================================
// Test Fixtures
// ============================================================================

const createActor = (role: string, id = 'actor-1'): WorkflowActor => ({
  id,
  name: `Test ${role}`,
  email: `${role}@council.gov.uk`,
  role: role as WorkflowActor['role'],
});

const socialWorker = createActor('social_worker', 'sw-1');
const housingOfficer = createActor('housing_officer', 'ho-1');
const manager = createActor('manager', 'mgr-1');
const admin = createActor('admin', 'admin-1');
const differentSocialWorker = createActor('social_worker', 'sw-2');

const createBaseState = (step: WorkflowStep = 'draft'): WorkflowState => ({
  entityId: 'minute-1',
  entityType: 'minute',
  currentStep: step,
  priority: 'normal',
  author: socialWorker,
  domain: 'children',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  history: [],
  version: 1,
  slaBreached: false,
});

// ============================================================================
// State Transition Tests
// ============================================================================

describe('Workflow Integration', () => {
  describe('State Transitions', () => {
    describe('Draft to Submitted', () => {
      it('allows author to submit draft', () => {
        const state = createBaseState('draft');
        const machine = new WorkflowStateMachine(state);

        const result = machine.executeTransition({
          action: 'submit',
          actor: socialWorker,
        });

        expect(result.success).toBe(true);
        expect(result.newState?.currentStep).toBe('submitted');
      });

      it('prevents non-author from submitting draft', () => {
        const state = createBaseState('draft');
        const machine = new WorkflowStateMachine(state);

        // Manager cannot submit (wrong role for submit action)
        const result = machine.executeTransition({
          action: 'submit',
          actor: manager,
        });

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INSUFFICIENT_PERMISSIONS');
      });

      it('records submission in history', () => {
        const state = createBaseState('draft');
        const machine = new WorkflowStateMachine(state);

        machine.executeTransition({
          action: 'submit',
          actor: socialWorker,
        });

        const history = machine.getHistory();
        expect(history).toHaveLength(1);
        expect(history[0].action).toBe('submit');
        expect(history[0].fromStep).toBe('draft');
        expect(history[0].toStep).toBe('submitted');
        expect(history[0].actor.id).toBe(socialWorker.id);
      });
    });

    describe('Submitted to In Review', () => {
      it('allows manager to assign and start review', () => {
        const state = createBaseState('submitted');
        const machine = new WorkflowStateMachine(state);

        const result = machine.executeTransition({
          action: 'assign',
          actor: manager,
        });

        expect(result.success).toBe(true);
        expect(result.newState?.currentStep).toBe('in_review');
      });

      it('allows admin to assign reviewer', () => {
        const state = createBaseState('submitted');
        const machine = new WorkflowStateMachine(state);

        const result = machine.executeTransition({
          action: 'assign',
          actor: admin,
        });

        expect(result.success).toBe(true);
        expect(result.newState?.currentStep).toBe('in_review');
      });

      it('prevents social worker from assigning', () => {
        const state = createBaseState('submitted');
        const machine = new WorkflowStateMachine(state);

        const result = machine.executeTransition({
          action: 'assign',
          actor: socialWorker,
        });

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('INSUFFICIENT_PERMISSIONS');
      });
    });

    describe('In Review to Approved', () => {
      it('allows reviewer to approve', () => {
        const state = createBaseState('in_review');
        state.assignedReviewer = manager;
        const machine = new WorkflowStateMachine(state);

        const result = machine.executeTransition({
          action: 'approve',
          actor: manager,
        });

        expect(result.success).toBe(true);
        expect(result.newState?.currentStep).toBe('approved');
      });

      it('allows admin to approve regardless of assignment', () => {
        const state = createBaseState('in_review');
        state.assignedReviewer = manager;
        const machine = new WorkflowStateMachine(state);

        const result = machine.executeTransition({
          action: 'approve',
          actor: admin,
        });

        expect(result.success).toBe(true);
        expect(result.newState?.currentStep).toBe('approved');
      });
    });

    describe('In Review to Changes Requested', () => {
      it('allows reviewer to request changes with comment', () => {
        const state = createBaseState('in_review');
        state.assignedReviewer = manager;
        const machine = new WorkflowStateMachine(state);

        const result = machine.executeTransition({
          action: 'request_changes',
          actor: manager,
          comment: 'Please add more detail to the risk assessment section.',
        });

        expect(result.success).toBe(true);
        expect(result.newState?.currentStep).toBe('changes_requested');
      });

      it('requires comment when requesting changes', () => {
        const state = createBaseState('in_review');
        state.assignedReviewer = manager;
        const machine = new WorkflowStateMachine(state);

        const result = machine.executeTransition({
          action: 'request_changes',
          actor: manager,
          // No comment provided
        });

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('COMMENT_REQUIRED');
      });
    });

    describe('Changes Requested to Submitted (Resubmit)', () => {
      it('allows original author to resubmit', () => {
        const state = createBaseState('changes_requested');
        const machine = new WorkflowStateMachine(state);

        const result = machine.executeTransition({
          action: 'resubmit',
          actor: socialWorker, // Original author
        });

        expect(result.success).toBe(true);
        expect(result.newState?.currentStep).toBe('submitted');
      });

      it('prevents different user from resubmitting', () => {
        const state = createBaseState('changes_requested');
        const machine = new WorkflowStateMachine(state);

        const result = machine.executeTransition({
          action: 'resubmit',
          actor: differentSocialWorker,
        });

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('CONDITION_NOT_MET');
      });
    });

    describe('Approved to Published', () => {
      it('allows admin to publish approved items', () => {
        const state = createBaseState('approved');
        const machine = new WorkflowStateMachine(state);

        const result = machine.executeTransition({
          action: 'publish',
          actor: admin,
        });

        expect(result.success).toBe(true);
        expect(result.newState?.currentStep).toBe('published');
      });

      it('prevents non-admin from publishing', () => {
        const state = createBaseState('approved');
        const machine = new WorkflowStateMachine(state);

        const result = machine.executeTransition({
          action: 'publish',
          actor: manager,
        });

        expect(result.success).toBe(false);
      });

      it('marks published as final state', () => {
        const state = createBaseState('published');
        const machine = new WorkflowStateMachine(state);

        expect(machine.isFinal()).toBe(true);
      });
    });

    describe('Withdraw', () => {
      it('allows author to withdraw submitted item', () => {
        const state = createBaseState('submitted');
        const machine = new WorkflowStateMachine(state);

        const result = machine.executeTransition({
          action: 'withdraw',
          actor: socialWorker,
        });

        expect(result.success).toBe(true);
        expect(result.newState?.currentStep).toBe('draft');
      });

      it('allows author to withdraw during review', () => {
        const state = createBaseState('in_review');
        const machine = new WorkflowStateMachine(state);

        const result = machine.executeTransition({
          action: 'withdraw',
          actor: socialWorker,
        });

        expect(result.success).toBe(true);
      });
    });

    describe('Escalation', () => {
      it('allows manager to escalate during review', () => {
        const state = createBaseState('in_review');
        state.assignedReviewer = manager;
        const machine = new WorkflowStateMachine(state);

        const result = machine.executeTransition({
          action: 'escalate',
          actor: manager,
          comment: 'Complex case requiring senior oversight',
        });

        expect(result.success).toBe(true);
      });

      it('requires comment when escalating', () => {
        const state = createBaseState('in_review');
        state.assignedReviewer = manager;
        const machine = new WorkflowStateMachine(state);

        const result = machine.executeTransition({
          action: 'escalate',
          actor: manager,
        });

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('COMMENT_REQUIRED');
      });
    });
  });

  // ==========================================================================
  // Permission Check Tests
  // ==========================================================================

  describe('Permission Checks', () => {
    describe('canTransition', () => {
      it('returns true for valid transitions', () => {
        const state = createBaseState('draft');
        const machine = new WorkflowStateMachine(state);

        expect(machine.canTransition('submit', socialWorker)).toBe(true);
      });

      it('returns false for invalid role', () => {
        const state = createBaseState('submitted');
        const machine = new WorkflowStateMachine(state);

        expect(machine.canTransition('approve', socialWorker)).toBe(false);
      });

      it('returns false for invalid step', () => {
        const state = createBaseState('draft');
        const machine = new WorkflowStateMachine(state);

        expect(machine.canTransition('approve', manager)).toBe(false);
      });
    });

    describe('getAvailableActions', () => {
      it('returns correct actions for draft state as author', () => {
        const state = createBaseState('draft');
        const machine = new WorkflowStateMachine(state);

        const actions = machine.getAvailableActions(socialWorker);

        expect(actions).toContain('submit');
      });

      it('returns correct actions for submitted state as manager', () => {
        const state = createBaseState('submitted');
        const machine = new WorkflowStateMachine(state);

        const actions = machine.getAvailableActions(manager);

        expect(actions).toContain('assign');
      });

      it('returns correct actions for in_review state as reviewer', () => {
        const state = createBaseState('in_review');
        state.assignedReviewer = manager;
        const machine = new WorkflowStateMachine(state);

        const actions = machine.getAvailableActions(manager);

        expect(actions).toContain('approve');
        expect(actions).toContain('request_changes');
        expect(actions).toContain('escalate');
      });

      it('returns limited actions for social worker during review', () => {
        const state = createBaseState('in_review');
        const machine = new WorkflowStateMachine(state);

        const actions = machine.getAvailableActions(socialWorker);

        // Social worker can only withdraw
        expect(actions).not.toContain('approve');
        expect(actions).not.toContain('request_changes');
      });

      it('returns no actions for final state', () => {
        const state = createBaseState('published');
        const machine = new WorkflowStateMachine(state);

        const actions = machine.getAvailableActions(socialWorker);

        expect(actions).toHaveLength(0);
      });
    });

    describe('getActionAvailability', () => {
      it('provides detailed availability info', () => {
        const state = createBaseState('in_review');
        const machine = new WorkflowStateMachine(state);

        const availability = machine.getActionAvailability(socialWorker);

        const approveInfo = availability.get('approve');
        expect(approveInfo?.available).toBe(false);
        expect(approveInfo?.reasons.length).toBeGreaterThan(0);
      });
    });

    describe('getTransitionErrors', () => {
      it('returns empty array for valid transition', () => {
        const state = createBaseState('draft');
        const machine = new WorkflowStateMachine(state);

        const errors = machine.getTransitionErrors('submit', socialWorker);

        expect(errors).toHaveLength(0);
      });

      it('returns role error for unauthorized action', () => {
        const state = createBaseState('in_review');
        const machine = new WorkflowStateMachine(state);

        const errors = machine.getTransitionErrors('approve', socialWorker);

        expect(errors.some((e) => e.includes('Role'))).toBe(true);
      });

      it('returns step error for invalid transition', () => {
        const state = createBaseState('draft');
        const machine = new WorkflowStateMachine(state);

        const errors = machine.getTransitionErrors('approve', manager);

        expect(errors.some((e) => e.includes('not valid from step'))).toBe(true);
      });
    });
  });

  // ==========================================================================
  // Audit Trail Tests
  // ==========================================================================

  describe('Audit Trail', () => {
    it('creates history entry for each transition', () => {
      const state = createBaseState('draft');
      const machine = new WorkflowStateMachine(state);

      machine.executeTransition({ action: 'submit', actor: socialWorker });

      const history = machine.getHistory();
      expect(history).toHaveLength(1);

      const entry = history[0];
      expect(entry.action).toBe('submit');
      expect(entry.fromStep).toBe('draft');
      expect(entry.toStep).toBe('submitted');
      expect(entry.actor.id).toBe(socialWorker.id);
      expect(entry.timestamp).toBeDefined();
    });

    it('preserves history across multiple transitions', () => {
      const state = createBaseState('draft');
      const machine = new WorkflowStateMachine(state);

      machine.executeTransition({ action: 'submit', actor: socialWorker });
      machine.executeTransition({ action: 'assign', actor: manager });
      machine.executeTransition({
        action: 'approve',
        actor: manager,
      });

      const history = machine.getHistory();
      expect(history).toHaveLength(3);

      expect(history[0].action).toBe('submit');
      expect(history[1].action).toBe('assign');
      expect(history[2].action).toBe('approve');
    });

    it('records comments in history', () => {
      const state = createBaseState('in_review');
      state.assignedReviewer = manager;
      const machine = new WorkflowStateMachine(state);

      const comment = 'Needs more detail on safeguarding measures';
      machine.executeTransition({
        action: 'request_changes',
        actor: manager,
        comment,
      });

      const history = machine.getHistory();
      expect(history[0].comment).toBe(comment);
    });

    it('records metadata in history', () => {
      const state = createBaseState('in_review');
      state.assignedReviewer = manager;
      const machine = new WorkflowStateMachine(state);

      machine.executeTransition({
        action: 'approve',
        actor: manager,
        metadata: {
          reviewDuration: 300, // 5 minutes
          checklistCompleted: true,
        },
      });

      const history = machine.getHistory();
      expect(history[0].metadata?.reviewDuration).toBe(300);
      expect(history[0].metadata?.checklistCompleted).toBe(true);
    });

    it('generates unique IDs for history entries', () => {
      const state = createBaseState('draft');
      const machine = new WorkflowStateMachine(state);

      machine.executeTransition({ action: 'submit', actor: socialWorker });
      machine.executeTransition({ action: 'withdraw', actor: socialWorker });
      machine.executeTransition({ action: 'submit', actor: socialWorker });

      const history = machine.getHistory();
      const ids = history.map((h) => h.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(history.length);
    });

    it('includes accurate timestamps', () => {
      const state = createBaseState('draft');
      const machine = new WorkflowStateMachine(state);

      const before = new Date().toISOString();
      machine.executeTransition({ action: 'submit', actor: socialWorker });
      const after = new Date().toISOString();

      const history = machine.getHistory();
      const timestamp = history[0].timestamp;

      expect(timestamp >= before).toBe(true);
      expect(timestamp <= after).toBe(true);
    });

    it('increments version on each transition', () => {
      const state = createBaseState('draft');
      const machine = new WorkflowStateMachine(state);

      expect(machine.getState().version).toBe(1);

      machine.executeTransition({ action: 'submit', actor: socialWorker });
      expect(machine.getState().version).toBe(2);

      machine.executeTransition({ action: 'assign', actor: manager });
      expect(machine.getState().version).toBe(3);
    });

    it('updates updatedAt on each transition', () => {
      const state = createBaseState('draft');
      state.updatedAt = '2026-01-01T00:00:00Z';
      const machine = new WorkflowStateMachine(state);

      machine.executeTransition({ action: 'submit', actor: socialWorker });

      const newState = machine.getState();
      expect(new Date(newState.updatedAt).getTime()).toBeGreaterThan(
        new Date('2026-01-01T00:00:00Z').getTime()
      );
    });
  });

  // ==========================================================================
  // State Accessors Tests
  // ==========================================================================

  describe('State Accessors', () => {
    it('getState returns immutable copy', () => {
      const state = createBaseState('draft');
      const machine = new WorkflowStateMachine(state);

      const state1 = machine.getState();
      const state2 = machine.getState();

      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });

    it('getCurrentStep returns current step', () => {
      const state = createBaseState('submitted');
      const machine = new WorkflowStateMachine(state);

      expect(machine.getCurrentStep()).toBe('submitted');
    });

    it('getHistory returns immutable copy', () => {
      const state = createBaseState('draft');
      const machine = new WorkflowStateMachine(state);

      machine.executeTransition({ action: 'submit', actor: socialWorker });

      const history1 = machine.getHistory();
      const history2 = machine.getHistory();

      expect(history1).not.toBe(history2);
      expect(history1).toEqual(history2);
    });

    it('isFinal returns correct value for each step', () => {
      const steps: WorkflowStep[] = [
        'draft',
        'submitted',
        'in_review',
        'changes_requested',
        'approved',
        'published',
      ];

      for (const step of steps) {
        const state = createBaseState(step);
        const machine = new WorkflowStateMachine(state);

        const expectedFinal = step === 'published';
        expect(machine.isFinal()).toBe(expectedFinal);
      }
    });
  });

  // ==========================================================================
  // Workflow Configuration Tests
  // ==========================================================================

  describe('Workflow Configuration', () => {
    it('has config for all workflow steps', () => {
      const steps: WorkflowStep[] = [
        'draft',
        'submitted',
        'in_review',
        'changes_requested',
        'approved',
        'published',
      ];

      for (const step of steps) {
        expect(WORKFLOW_STEP_CONFIG[step]).toBeDefined();
        expect(WORKFLOW_STEP_CONFIG[step].label).toBeDefined();
        expect(WORKFLOW_STEP_CONFIG[step].description).toBeDefined();
        expect(typeof WORKFLOW_STEP_CONFIG[step].isFinal).toBe('boolean');
      }
    });

    it('has config for all workflow actions', () => {
      const actions: WorkflowAction[] = [
        'submit',
        'approve',
        'reject',
        'request_changes',
        'escalate',
        'resubmit',
        'withdraw',
        'publish',
        'assign',
        'unassign',
      ];

      for (const action of actions) {
        expect(WORKFLOW_ACTION_CONFIG[action]).toBeDefined();
        expect(WORKFLOW_ACTION_CONFIG[action].label).toBeDefined();
        expect(typeof WORKFLOW_ACTION_CONFIG[action].requiresComment).toBe('boolean');
      }
    });

    it('has transitions defined for the happy path', () => {
      const happyPath = [
        { action: 'submit', from: 'draft', to: 'submitted' },
        { action: 'assign', from: 'submitted', to: 'in_review' },
        { action: 'approve', from: 'in_review', to: 'approved' },
        { action: 'publish', from: 'approved', to: 'published' },
      ];

      for (const { action, from, to } of happyPath) {
        const transition = WORKFLOW_TRANSITIONS.find(
          (t) =>
            t.action === action &&
            (Array.isArray(t.from) ? t.from.includes(from as WorkflowStep) : t.from === from)
        );

        expect(transition).toBeDefined();
        expect(transition?.to).toBe(to);
      }
    });
  });

  // ==========================================================================
  // Edge Cases and Error Handling
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles concurrent modification attempts', () => {
      const state = createBaseState('draft');
      const machine1 = new WorkflowStateMachine(state);
      const machine2 = new WorkflowStateMachine({ ...state });

      // Both try to submit
      const result1 = machine1.executeTransition({ action: 'submit', actor: socialWorker });
      const result2 = machine2.executeTransition({ action: 'submit', actor: socialWorker });

      // Both should succeed independently (they're different instances)
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);

      // But if we tried to merge, we'd need version checking (handled at API level)
      expect(result1.newState?.version).toBe(2);
      expect(result2.newState?.version).toBe(2);
    });

    it('prevents invalid action from current step', () => {
      const state = createBaseState('draft');
      const machine = new WorkflowStateMachine(state);

      const result = machine.executeTransition({
        action: 'publish',
        actor: admin,
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('INVALID_TRANSITION');
    });

    it('handles empty comment for actions requiring comment', () => {
      const state = createBaseState('in_review');
      state.assignedReviewer = manager;
      const machine = new WorkflowStateMachine(state);

      const result = machine.executeTransition({
        action: 'request_changes',
        actor: manager,
        comment: '   ', // Whitespace only
      });

      expect(result.success).toBe(false);
      expect(result.errorCode).toBe('COMMENT_REQUIRED');
    });

    it('trims whitespace from comments', () => {
      const state = createBaseState('in_review');
      state.assignedReviewer = manager;
      const machine = new WorkflowStateMachine(state);

      const result = machine.executeTransition({
        action: 'request_changes',
        actor: manager,
        comment: '  Valid comment with spaces  ',
      });

      expect(result.success).toBe(true);
      expect(machine.getHistory()[0].comment).toBe('Valid comment with spaces');
    });

    it('handles housing officer role same as social worker', () => {
      const state = createBaseState('draft');
      state.author = housingOfficer;
      const machine = new WorkflowStateMachine(state);

      const result = machine.executeTransition({
        action: 'submit',
        actor: housingOfficer,
      });

      expect(result.success).toBe(true);
    });
  });
});
