'use client';

/**
 * Planner Sync Component
 * 
 * UI component for syncing action items from minutes to Microsoft Planner.
 * Provides plan/bucket selection, sync controls, and status display.
 * 
 * @module components/planner/PlannerSync
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlanner } from '@/hooks/usePlanner';
import { ActionItem, PlannerPlan, PlannerBucket, PlannerSyncResult } from '@/lib/planner';

// ============================================================================
// Types
// ============================================================================

export interface PlannerSyncProps {
  /** Action items to sync */
  actionItems: ActionItem[];
  /** Minute ID for context */
  minuteId: string;
  /** Minute title for task description */
  minuteTitle?: string;
  /** Meeting date for task description */
  meetingDate?: string;
  /** Called when sync completes */
  onSyncComplete?: (result: PlannerSyncResult) => void;
  /** Called when sync fails */
  onSyncError?: (error: Error) => void;
  /** Custom class name */
  className?: string;
}

// ============================================================================
// Subcomponents
// ============================================================================

function ConnectionButton({
  isConnected,
  isConnecting,
  onConnect,
  onDisconnect,
}: {
  isConnected: boolean;
  isConnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
    <button
      onClick={isConnected ? onDisconnect : onConnect}
      disabled={isConnecting}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
        transition-all duration-200 
        ${isConnected
          ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {isConnecting ? (
        <>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Connecting...
        </>
      ) : isConnected ? (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Connected
        </>
      ) : (
        <>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Connect to Planner
        </>
      )}
    </button>
  );
}

function PlanSelector({
  plans,
  selectedPlan,
  onSelectPlan,
  isLoading,
}: {
  plans: PlannerPlan[];
  selectedPlan: PlannerPlan | null;
  onSelectPlan: (plan: PlannerPlan) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading plans...
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No plans available. Create a plan in Microsoft Planner first.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Select Plan
      </label>
      <select
        value={selectedPlan?.id ?? ''}
        onChange={(e) => {
          const plan = plans.find(p => p.id === e.target.value);
          if (plan) onSelectPlan(plan);
        }}
        className="
          w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
          bg-white dark:bg-gray-800 text-gray-900 dark:text-white
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
        "
      >
        <option value="">Choose a plan...</option>
        {plans.map(plan => (
          <option key={plan.id} value={plan.id}>
            {plan.title}
          </option>
        ))}
      </select>
    </div>
  );
}

function BucketSelector({
  buckets,
  selectedBucket,
  onSelectBucket,
  isLoading,
}: {
  buckets: PlannerBucket[];
  selectedBucket: PlannerBucket | null;
  onSelectBucket: (bucket: PlannerBucket | null) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading buckets...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Select Bucket (Optional)
      </label>
      <select
        value={selectedBucket?.id ?? ''}
        onChange={(e) => {
          if (!e.target.value) {
            onSelectBucket(null);
          } else {
            const bucket = buckets.find(b => b.id === e.target.value);
            onSelectBucket(bucket ?? null);
          }
        }}
        className="
          w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600
          bg-white dark:bg-gray-800 text-gray-900 dark:text-white
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
        "
      >
        <option value="">No specific bucket</option>
        {buckets.map(bucket => (
          <option key={bucket.id} value={bucket.id}>
            {bucket.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function ActionItemsList({
  items,
  selectedIds,
  onToggle,
}: {
  items: ActionItem[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Action Items ({selectedIds.size} of {items.length} selected)
        </label>
      </div>
      <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        {items.map(item => (
          <label
            key={item.id}
            className="
              flex items-start gap-3 p-3 cursor-pointer
              hover:bg-gray-50 dark:hover:bg-gray-800/50
              border-b border-gray-100 dark:border-gray-800 last:border-b-0
            "
          >
            <input
              type="checkbox"
              checked={selectedIds.has(item.id)}
              onChange={() => onToggle(item.id)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${item.isCompleted ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                {item.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {item.assignee && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    👤 {item.assignee}
                  </span>
                )}
                {item.dueDate && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    📅 {new Date(item.dueDate).toLocaleDateString()}
                  </span>
                )}
                {item.priority && (
                  <span className={`
                    text-xs px-1.5 py-0.5 rounded
                    ${item.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                    ${item.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                    ${item.priority === 'low' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                  `}>
                    {item.priority}
                  </span>
                )}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}

function SyncResultDisplay({
  result,
  onDismiss,
}: {
  result: PlannerSyncResult;
  onDismiss: () => void;
}) {
  const hasErrors = result.failed.length > 0;
  const hasConflicts = result.conflicts.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        p-4 rounded-lg border
        ${hasErrors || hasConflicts
          ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
          : 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 dark:text-white">
            Sync Complete
          </h4>
          <ul className="text-sm space-y-1">
            <li className="text-green-600 dark:text-green-400">
              ✓ {result.synced.length} task{result.synced.length !== 1 ? 's' : ''} synced
            </li>
            {result.failed.length > 0 && (
              <li className="text-red-600 dark:text-red-400">
                ✗ {result.failed.length} failed
              </li>
            )}
            {result.conflicts.length > 0 && (
              <li className="text-yellow-600 dark:text-yellow-400">
                ⚠ {result.conflicts.length} conflict{result.conflicts.length !== 1 ? 's' : ''}
              </li>
            )}
          </ul>
        </div>
        <button
          onClick={onDismiss}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function PlannerSync({
  actionItems,
  minuteId,
  minuteTitle,
  meetingDate,
  onSyncComplete,
  onSyncError,
  className,
}: PlannerSyncProps) {
  const {
    isConnected,
    isConnecting,
    isSyncing,
    plans,
    buckets,
    isLoadingPlans,
    isLoadingBuckets,
    connect,
    disconnect,
    selectPlan,
    selectBucket,
    selectedPlan,
    selectedBucket,
    syncActionItems,
  } = usePlanner();

  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(() => 
    new Set(actionItems.filter(i => !i.isCompleted).map(i => i.id))
  );
  const [syncResult, setSyncResult] = useState<PlannerSyncResult | null>(null);

  // Update selected items when action items change
  useEffect(() => {
    setSelectedItemIds(new Set(actionItems.filter(i => !i.isCompleted).map(i => i.id)));
  }, [actionItems]);

  const handleToggleItem = useCallback((id: string) => {
    setSelectedItemIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSync = useCallback(async () => {
    const itemsToSync = actionItems
      .filter(item => selectedItemIds.has(item.id))
      .map(item => ({
        ...item,
        minuteTitle,
        meetingDate,
      }));

    try {
      const result = await syncActionItems(itemsToSync);
      setSyncResult(result);
      onSyncComplete?.(result);
    } catch (error) {
      onSyncError?.(error as Error);
    }
  }, [actionItems, selectedItemIds, minuteTitle, meetingDate, syncActionItems, onSyncComplete, onSyncError]);

  if (actionItems.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 dark:text-gray-400 ${className}`}>
        No action items to sync.
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Sync to Microsoft Planner
        </h3>
        <ConnectionButton
          isConnected={isConnected}
          isConnecting={isConnecting}
          onConnect={connect}
          onDisconnect={disconnect}
        />
      </div>

      <AnimatePresence mode="wait">
        {isConnected ? (
          <motion.div
            key="connected"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Plan Selection */}
            <PlanSelector
              plans={plans}
              selectedPlan={selectedPlan}
              onSelectPlan={selectPlan}
              isLoading={isLoadingPlans}
            />

            {/* Bucket Selection (only if plan selected) */}
            {selectedPlan && (
              <BucketSelector
                buckets={buckets}
                selectedBucket={selectedBucket}
                onSelectBucket={selectBucket}
                isLoading={isLoadingBuckets}
              />
            )}

            {/* Action Items Selection */}
            <ActionItemsList
              items={actionItems}
              selectedIds={selectedItemIds}
              onToggle={handleToggleItem}
            />

            {/* Sync Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSync}
                disabled={!selectedPlan || selectedItemIds.size === 0 || isSyncing}
                className="
                  inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium
                  bg-blue-600 text-white hover:bg-blue-700
                  dark:bg-blue-500 dark:hover:bg-blue-600
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200
                "
              >
                {isSyncing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Syncing...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Sync {selectedItemIds.size} Item{selectedItemIds.size !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>

            {/* Sync Result */}
            <AnimatePresence>
              {syncResult && (
                <SyncResultDisplay
                  result={syncResult}
                  onDismiss={() => setSyncResult(null)}
                />
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="disconnected"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8"
          >
            <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Connect to Microsoft Planner
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
              Sync your action items directly to Microsoft Planner tasks for easy tracking and assignment.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PlannerSync;
