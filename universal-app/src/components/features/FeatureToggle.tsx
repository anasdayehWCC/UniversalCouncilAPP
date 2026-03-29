/**
 * FeatureToggle Component
 *
 * Admin toggle component for managing feature flag overrides.
 * Provides a UI for enabling/disabling flags locally.
 */

'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useFeatureFlagContext,
  useFeatureFlagAdmin,
} from '@/lib/features/provider';
import { getAllFlags, FLAG_IDS, getFlagsByStatus, getFlagsByTag } from '@/lib/features/flags';
import type { FeatureFlag, FeatureFlagId, FeatureOverride } from '@/lib/features/types';
import {
  Search,
  X,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Tag,
  Clock,
  Users,
  Building2,
  Beaker,
  Rocket,
  AlertTriangle,
  Check,
  Undo,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface FeatureToggleProps {
  /** Show only specific flags */
  flagIds?: FeatureFlagId[];
  /** Filter by tag */
  tags?: string[];
  /** Filter by status */
  status?: FeatureFlag['status'][];
  /** Compact mode */
  compact?: boolean;
  /** Show search */
  showSearch?: boolean;
  /** Show filters */
  showFilters?: boolean;
  /** Callback when flag is toggled */
  onToggle?: (flagId: FeatureFlagId, enabled: boolean) => void;
}

interface FeatureTogglePanelProps {
  /** Title for the panel */
  title?: string;
  /** Description */
  description?: string;
  /** Show sync button */
  showSync?: boolean;
  /** Show clear all button */
  showClearAll?: boolean;
}

// ============================================================================
// Status Icon Component
// ============================================================================

function StatusIcon({ status }: { status: FeatureFlag['status'] }) {
  switch (status) {
    case 'released':
      return <Rocket className="w-3.5 h-3.5 text-success" />;
    case 'beta':
      return <Beaker className="w-3.5 h-3.5 text-primary" />;
    case 'development':
      return <AlertTriangle className="w-3.5 h-3.5 text-warning" />;
    case 'deprecated':
      return <AlertTriangle className="w-3.5 h-3.5 text-destructive" />;
    default:
      return null;
  }
}

// ============================================================================
// Toggle Switch Component
// ============================================================================

interface ToggleSwitchProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

function ToggleSwitch({ enabled, onChange, disabled = false, size = 'md' }: ToggleSwitchProps) {
  const sizes = {
    sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
    md: { track: 'w-10 h-5', thumb: 'w-4 h-4', translate: 'translate-x-5' },
  };

  const s = sizes[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`
        relative inline-flex shrink-0 ${s.track} cursor-pointer rounded-full
        transition-colors duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${enabled ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block ${s.thumb} rounded-full bg-white shadow-lg
          ring-0 transition duration-200 ease-in-out
          ${enabled ? s.translate : 'translate-x-0.5'}
        `}
      />
    </button>
  );
}

// ============================================================================
// Single Flag Toggle Component
// ============================================================================

interface FlagToggleRowProps {
  flag: FeatureFlag;
  isEnabled: boolean;
  hasOverride: boolean;
  onToggle: (enabled: boolean) => void;
  onClearOverride: () => void;
  compact?: boolean;
}

function FlagToggleRow({
  flag,
  isEnabled,
  hasOverride,
  onToggle,
  onClearOverride,
  compact = false,
}: FlagToggleRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div
        className={`
          flex items-center justify-between gap-4 py-3 px-4
          ${compact ? 'py-2' : 'py-3'}
        `}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-400" />
            )}
          </button>

          <StatusIcon status={flag.status} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{flag.name}</span>
              {hasOverride && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-warning/10 text-warning">
                  Override
                </span>
              )}
            </div>
            {!compact && flag.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                {flag.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasOverride && (
            <button
              onClick={onClearOverride}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
              title="Clear override"
            >
              <Undo className="w-4 h-4" />
            </button>
          )}
          <ToggleSwitch enabled={isEnabled} onChange={onToggle} size={compact ? 'sm' : 'md'} />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pl-12 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500">ID:</span>
                  <span className="ml-2 font-mono">{flag.id}</span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="ml-2 capitalize">{flag.status}</span>
                </div>
                <div>
                  <span className="text-gray-500">Default:</span>
                  <span className="ml-2">{flag.defaultEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                {flag.owner && (
                  <div>
                    <span className="text-gray-500">Owner:</span>
                    <span className="ml-2">{flag.owner}</span>
                  </div>
                )}
              </div>

              {flag.tags && flag.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-3 h-3 text-gray-400" />
                  {flag.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {flag.conditions && flag.conditions.length > 0 && (
                <div className="text-gray-500">
                  <span className="text-gray-400">Conditions:</span>{' '}
                  {flag.conditions.map((c) => c.type).join(', ')}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Feature Toggle List Component
// ============================================================================

export function FeatureToggle({
  flagIds,
  tags,
  status,
  compact = false,
  showSearch = true,
  showFilters = true,
  onToggle,
}: FeatureToggleProps) {
  const { isEnabled, state } = useFeatureFlagContext();
  const admin = useFeatureFlagAdmin();
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(tags || []);
  const [selectedStatus, setSelectedStatus] = useState<FeatureFlag['status'][]>(status || []);

  // Get all available tags
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    getAllFlags().forEach((flag) => {
      flag.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, []);

  // Filter flags
  const filteredFlags = useMemo(() => {
    let flags = flagIds ? flagIds.map((id) => state.flags.get(id)).filter(Boolean) : getAllFlags();

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      flags = flags.filter(
        (flag) =>
          flag!.name.toLowerCase().includes(searchLower) ||
          flag!.id.toLowerCase().includes(searchLower) ||
          flag!.description?.toLowerCase().includes(searchLower) ||
          flag!.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    // Tag filter
    if (selectedTags.length > 0) {
      flags = flags.filter((flag) =>
        selectedTags.some((tag) => flag!.tags?.includes(tag))
      );
    }

    // Status filter
    if (selectedStatus.length > 0) {
      flags = flags.filter((flag) => selectedStatus.includes(flag!.status));
    }

    return flags as FeatureFlag[];
  }, [flagIds, state.flags, search, selectedTags, selectedStatus]);

  const handleToggle = (flagId: FeatureFlagId, enabled: boolean) => {
    admin.createOverride({
      flagId,
      enabled,
      reason: 'Manual toggle from admin UI',
    });
    onToggle?.(flagId, enabled);
  };

  const handleClearOverride = (flagId: FeatureFlagId) => {
    admin.removeOverride(flagId);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search flags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          {/* Status filters */}
          {(['released', 'beta', 'development', 'deprecated'] as const).map((s) => (
            <button
              key={s}
              onClick={() =>
                setSelectedStatus((prev) =>
                  prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                )
              }
              className={`
                px-2 py-1 text-xs rounded-full border transition-colors
                ${
                  selectedStatus.includes(s)
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-primary'
                }
              `}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Flag list */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
        {filteredFlags.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No feature flags found
          </div>
        ) : (
          filteredFlags.map((flag) => (
            <FlagToggleRow
              key={flag.id}
              flag={flag}
              isEnabled={isEnabled(flag.id)}
              hasOverride={state.overrides.has(flag.id)}
              onToggle={(enabled) => handleToggle(flag.id, enabled)}
              onClearOverride={() => handleClearOverride(flag.id)}
              compact={compact}
            />
          ))
        )}
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          {filteredFlags.length} of {getAllFlags().length} flags
        </span>
        <span>{state.overrides.size} overrides active</span>
      </div>
    </div>
  );
}

// ============================================================================
// Feature Toggle Panel Component
// ============================================================================

export function FeatureTogglePanel({
  title = 'Feature Flags',
  description = 'Toggle features for testing and development',
  showSync = true,
  showClearAll = true,
}: FeatureTogglePanelProps) {
  const admin = useFeatureFlagAdmin();
  const { state, isLoading } = useFeatureFlagContext();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await admin.syncPostHog();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          </div>
          <div className="flex items-center gap-2">
            {showSync && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                title="Sync from PostHog"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin motion-reduce:animate-none' : ''}`} />
              </button>
            )}
            {showClearAll && state.overrides.size > 0 && (
              <button
                onClick={() => admin.clearOverrides()}
                className="px-2 py-1 text-xs text-destructive hover:text-destructive rounded hover:bg-destructive/10"
              >
                Clear All Overrides
              </button>
            )}
          </div>
        </div>

        {/* Last synced info */}
        {state.lastSyncedAt && (
          <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-2">
            <Clock className="w-3 h-3" />
            <span>
              Last synced: {new Date(state.lastSyncedAt).toLocaleTimeString()}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin motion-reduce:animate-none text-gray-400" />
          </div>
        ) : (
          <FeatureToggle />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default FeatureToggle;
