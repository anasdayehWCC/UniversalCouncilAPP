/**
 * Workflow Notifications
 * 
 * Functions for sending notifications during workflow transitions.
 * Integrates with the notification system to alert users of workflow events.
 * 
 * @module lib/workflow/notifications
 */

import {
  WorkflowState,
  WorkflowAction,
  WorkflowActor,
  WorkflowHistoryEntry,
  WORKFLOW_STEP_CONFIG,
  WORKFLOW_ACTION_CONFIG,
} from './types';
import type { Notification, NotificationType, NotificationPriority } from '@/lib/notifications/types';

// ============================================================================
// Notification Configuration
// ============================================================================

/**
 * Maps workflow actions to notification types
 */
const ACTION_TO_NOTIFICATION_TYPE: Partial<Record<WorkflowAction, NotificationType>> = {
  submit: 'approval_needed',
  approve: 'minute_approved',
  reject: 'minute_rejected',
  request_changes: 'minute_rejected', // Uses same type with different message
  escalate: 'approval_needed',
  assign: 'assignment',
};

/**
 * Maps workflow actions to notification priorities
 */
const ACTION_TO_PRIORITY: Partial<Record<WorkflowAction, NotificationPriority>> = {
  submit: 'normal',
  approve: 'normal',
  reject: 'high',
  request_changes: 'high',
  escalate: 'urgent',
  assign: 'normal',
};

// ============================================================================
// Notification Creation Functions
// ============================================================================

/**
 * Create a notification for a workflow event
 */
function createWorkflowNotification(
  type: NotificationType,
  title: string,
  body: string,
  priority: NotificationPriority,
  entityId: string,
  entityType: 'minute' | 'transcription',
  actor: WorkflowActor,
  actions?: Array<{ id: string; label: string; type: 'primary' | 'secondary'; url: string }>
): Notification {
  return {
    id: `notif_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`,
    type,
    title,
    body,
    priority,
    read: false,
    createdAt: new Date().toISOString(),
    icon: getNotificationIcon(type),
    data: {
      entityId,
      entityType,
      url: `/${entityType}s/${entityId}`,
      actorId: actor.id,
      actorName: actor.name,
      actorAvatar: actor.avatarUrl,
    },
    actions,
  };
}

/**
 * Get icon name for notification type
 */
function getNotificationIcon(type: NotificationType): string {
  const icons: Record<NotificationType, string> = {
    approval_needed: 'FileCheck',
    minute_approved: 'CheckCircle2',
    minute_rejected: 'XCircle',
    assignment: 'UserPlus',
    mention: 'AtSign',
    reminder: 'Bell',
    system: 'Info',
    comment: 'MessageSquare',
    export_ready: 'Download',
  };
  return icons[type] ?? 'Bell';
}

// ============================================================================
// Recipient Resolution
// ============================================================================

/**
 * Determine notification recipients based on action and workflow state
 */
export function getNotificationRecipients(
  state: WorkflowState,
  action: WorkflowAction,
  actor: WorkflowActor
): WorkflowActor[] {
  const recipients: WorkflowActor[] = [];

  switch (action) {
    case 'submit':
    case 'resubmit':
      // Notify managers (would typically query for available managers)
      // For now, notify assigned reviewer if exists
      if (state.assignedReviewer && state.assignedReviewer.id !== actor.id) {
        recipients.push(state.assignedReviewer);
      }
      break;

    case 'approve':
    case 'reject':
    case 'request_changes':
      // Notify the author
      if (state.author.id !== actor.id) {
        recipients.push(state.author);
      }
      break;

    case 'escalate':
      // Notify escalation target
      if (state.escalationTarget) {
        recipients.push(state.escalationTarget);
      }
      // Also notify the author
      if (state.author.id !== actor.id) {
        recipients.push(state.author);
      }
      break;

    case 'assign':
      // Notify the assigned reviewer
      if (state.assignedReviewer && state.assignedReviewer.id !== actor.id) {
        recipients.push(state.assignedReviewer);
      }
      break;

    case 'withdraw':
      // Notify assigned reviewer if any
      if (state.assignedReviewer && state.assignedReviewer.id !== actor.id) {
        recipients.push(state.assignedReviewer);
      }
      break;

    case 'publish':
      // Notify the author
      if (state.author.id !== actor.id) {
        recipients.push(state.author);
      }
      break;
  }

  return recipients;
}

// ============================================================================
// Notification Generators
// ============================================================================

/**
 * Notify managers when minutes are submitted for review
 */
export async function notifyOnSubmit(
  state: WorkflowState,
  actor: WorkflowActor,
  managerIds?: string[]
): Promise<Notification[]> {
  const notifications: Notification[] = [];
  const stepConfig = WORKFLOW_STEP_CONFIG[state.currentStep];

  // Create notification for managers
  const notification = createWorkflowNotification(
    'approval_needed',
    'Minutes Submitted for Review',
    `${actor.name} has submitted meeting minutes for your review.`,
    'normal',
    state.entityId,
    state.entityType,
    actor,
    [
      {
        id: 'review',
        label: 'Review Now',
        type: 'primary',
        url: `/${state.entityType}s/${state.entityId}/review`,
      },
      {
        id: 'later',
        label: 'View Later',
        type: 'secondary',
        url: `/${state.entityType}s/${state.entityId}`,
      },
    ]
  );

  notifications.push(notification);

  // In a real implementation, send to notification service
  await sendNotifications(notifications, managerIds);

  return notifications;
}

/**
 * Notify author when minutes are approved
 */
export async function notifyOnApproval(
  state: WorkflowState,
  actor: WorkflowActor,
  comment?: string
): Promise<Notification[]> {
  const notifications: Notification[] = [];

  const bodyText = comment
    ? `Your meeting minutes have been approved by ${actor.name}. Comment: "${comment}"`
    : `Your meeting minutes have been approved by ${actor.name}.`;

  const notification = createWorkflowNotification(
    'minute_approved',
    'Minutes Approved! ✓',
    bodyText,
    'normal',
    state.entityId,
    state.entityType,
    actor,
    [
      {
        id: 'view',
        label: 'View Minutes',
        type: 'primary',
        url: `/${state.entityType}s/${state.entityId}`,
      },
    ]
  );

  notifications.push(notification);

  // Notify the author
  await sendNotifications(notifications, [state.author.id]);

  return notifications;
}

/**
 * Notify author when changes are requested
 */
export async function notifyOnChangesRequested(
  state: WorkflowState,
  actor: WorkflowActor,
  feedback: string
): Promise<Notification[]> {
  const notifications: Notification[] = [];

  const notification = createWorkflowNotification(
    'minute_rejected',
    'Changes Requested',
    `${actor.name} has requested changes to your meeting minutes: "${truncate(feedback, 100)}"`,
    'high',
    state.entityId,
    state.entityType,
    actor,
    [
      {
        id: 'edit',
        label: 'Make Changes',
        type: 'primary',
        url: `/${state.entityType}s/${state.entityId}/edit`,
      },
      {
        id: 'view_feedback',
        label: 'View Feedback',
        type: 'secondary',
        url: `/${state.entityType}s/${state.entityId}/feedback`,
      },
    ]
  );

  notifications.push(notification);

  // Notify the author
  await sendNotifications(notifications, [state.author.id]);

  return notifications;
}

/**
 * Notify author when minutes are rejected
 */
export async function notifyOnRejection(
  state: WorkflowState,
  actor: WorkflowActor,
  reason: string
): Promise<Notification[]> {
  const notifications: Notification[] = [];

  const notification = createWorkflowNotification(
    'minute_rejected',
    'Minutes Rejected',
    `${actor.name} has rejected your meeting minutes. Reason: "${truncate(reason, 100)}"`,
    'high',
    state.entityId,
    state.entityType,
    actor,
    [
      {
        id: 'view',
        label: 'View Details',
        type: 'primary',
        url: `/${state.entityType}s/${state.entityId}`,
      },
    ]
  );

  notifications.push(notification);

  // Notify the author
  await sendNotifications(notifications, [state.author.id]);

  return notifications;
}

/**
 * Notify senior manager when workflow is escalated
 */
export async function notifyOnEscalation(
  state: WorkflowState,
  actor: WorkflowActor,
  escalationTargetId: string,
  reason: string
): Promise<Notification[]> {
  const notifications: Notification[] = [];

  // Notification for escalation target (senior manager)
  const escalationNotif = createWorkflowNotification(
    'approval_needed',
    'Escalation: Review Required',
    `${actor.name} has escalated meeting minutes for your review. Reason: "${truncate(reason, 80)}"`,
    'urgent',
    state.entityId,
    state.entityType,
    actor,
    [
      {
        id: 'review',
        label: 'Review Now',
        type: 'primary',
        url: `/${state.entityType}s/${state.entityId}/review`,
      },
    ]
  );
  notifications.push(escalationNotif);

  // Notification for original author
  const authorNotif = createWorkflowNotification(
    'system',
    'Minutes Escalated',
    `Your meeting minutes have been escalated for senior review by ${actor.name}.`,
    'normal',
    state.entityId,
    state.entityType,
    actor
  );
  notifications.push(authorNotif);

  // Send notifications
  await sendNotifications([escalationNotif], [escalationTargetId]);
  await sendNotifications([authorNotif], [state.author.id]);

  return notifications;
}

/**
 * Notify reviewer when assigned to a submission
 */
export async function notifyOnAssignment(
  state: WorkflowState,
  actor: WorkflowActor,
  assigneeId: string,
  assigneeName: string
): Promise<Notification[]> {
  const notifications: Notification[] = [];

  const notification = createWorkflowNotification(
    'assignment',
    'New Review Assignment',
    `${actor.name} has assigned you to review meeting minutes by ${state.author.name}.`,
    'normal',
    state.entityId,
    state.entityType,
    actor,
    [
      {
        id: 'review',
        label: 'Start Review',
        type: 'primary',
        url: `/${state.entityType}s/${state.entityId}/review`,
      },
    ]
  );

  notifications.push(notification);

  // Notify the assignee
  await sendNotifications(notifications, [assigneeId]);

  return notifications;
}

/**
 * Notify about upcoming SLA breach
 */
export async function notifySlaBreach(
  state: WorkflowState,
  hoursRemaining: number
): Promise<Notification[]> {
  const notifications: Notification[] = [];
  const recipients: string[] = [];

  // Determine recipients based on current step
  if (state.assignedReviewer) {
    recipients.push(state.assignedReviewer.id);
  }
  // Always notify author
  recipients.push(state.author.id);

  const priority: NotificationPriority = hoursRemaining <= 4 ? 'urgent' : 'high';

  const notification = createWorkflowNotification(
    'reminder',
    hoursRemaining <= 0 ? 'SLA Breached!' : 'SLA Warning',
    hoursRemaining <= 0
      ? `The SLA for reviewing meeting minutes by ${state.author.name} has been breached.`
      : `Only ${hoursRemaining} hours remaining to review meeting minutes by ${state.author.name}.`,
    priority,
    state.entityId,
    state.entityType,
    state.author, // Use author as the "actor" for context
    [
      {
        id: 'review',
        label: 'Review Now',
        type: 'primary',
        url: `/${state.entityType}s/${state.entityId}/review`,
      },
    ]
  );

  notifications.push(notification);

  await sendNotifications(notifications, recipients);

  return notifications;
}

/**
 * Generate notification based on workflow history entry
 */
export function createNotificationFromHistory(
  state: WorkflowState,
  historyEntry: WorkflowHistoryEntry
): Notification | null {
  const { action, actor, comment } = historyEntry;
  const notificationType = ACTION_TO_NOTIFICATION_TYPE[action];
  
  if (!notificationType) {
    return null;
  }

  const actionConfig = WORKFLOW_ACTION_CONFIG[action];
  const priority = ACTION_TO_PRIORITY[action] ?? 'normal';

  return createWorkflowNotification(
    notificationType,
    actionConfig.label,
    comment ?? actionConfig.description,
    priority,
    state.entityId,
    state.entityType,
    actor
  );
}

// ============================================================================
// Private Helpers
// ============================================================================

/**
 * Send notifications to recipients
 * In a real implementation, this would call the notification service API
 */
async function sendNotifications(
  notifications: Notification[],
  recipientIds?: string[]
): Promise<void> {
  // This would integrate with the actual notification service
  // For now, we just log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Workflow Notifications]', {
      notifications: notifications.map(n => ({ id: n.id, title: n.title, type: n.type })),
      recipients: recipientIds,
    });
  }

  // In production, this would be:
  // await notificationService.sendBatch(notifications, recipientIds);
}

/**
 * Truncate text to a maximum length
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

// ============================================================================
// Bulk Notification Utilities
// ============================================================================

/**
 * Process notifications for a batch of workflow transitions
 */
export async function processWorkflowNotifications(
  state: WorkflowState,
  action: WorkflowAction,
  actor: WorkflowActor,
  comment?: string,
  metadata?: Record<string, string>
): Promise<Notification[]> {
  switch (action) {
    case 'submit':
    case 'resubmit':
      return notifyOnSubmit(state, actor);

    case 'approve':
      return notifyOnApproval(state, actor, comment);

    case 'reject':
      return notifyOnRejection(state, actor, comment ?? 'No reason provided');

    case 'request_changes':
      return notifyOnChangesRequested(state, actor, comment ?? 'Please review and make changes');

    case 'escalate':
      if (metadata?.escalationTargetId) {
        return notifyOnEscalation(
          state,
          actor,
          metadata.escalationTargetId,
          comment ?? 'Escalated for senior review'
        );
      }
      return [];

    case 'assign':
      if (metadata?.assigneeId && metadata?.assigneeName) {
        return notifyOnAssignment(
          state,
          actor,
          metadata.assigneeId,
          metadata.assigneeName
        );
      }
      return [];

    default:
      return [];
  }
}
