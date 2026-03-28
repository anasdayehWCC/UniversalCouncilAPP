'use client';

/**
 * Notification Preferences Component
 * 
 * Settings panel for managing notification preferences including
 * category toggles, quiet hours, and global settings.
 * 
 * @module components/notifications/NotificationPreferences
 */

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Vibrate,
  Moon,
  Clock,
  Mail,
  Smartphone,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  UserPlus,
  AtSign,
  Download,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotificationContext } from '@/providers/NotificationProvider';
import type {
  NotificationPreferences as Preferences,
  NotificationCategoryPreferences,
  ChannelSettings,
  QuietHours,
} from '@/lib/notifications/types';

// ============================================================================
// Types
// ============================================================================

interface NotificationPreferencesProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Additional class names */
  className?: string;
}

type CategoryKey = keyof NotificationCategoryPreferences;

// ============================================================================
// Category Configuration
// ============================================================================

const CATEGORY_CONFIG: {
  key: CategoryKey;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    key: 'approvals',
    label: 'Approvals',
    description: 'Minutes waiting for your approval',
    icon: <CheckCircle className="h-5 w-5 text-amber-500" />,
  },
  {
    key: 'assignments',
    label: 'Assignments',
    description: 'New cases or minutes assigned to you',
    icon: <UserPlus className="h-5 w-5 text-blue-500" />,
  },
  {
    key: 'mentions',
    label: 'Mentions',
    description: 'When someone mentions you in a comment',
    icon: <AtSign className="h-5 w-5 text-purple-500" />,
  },
  {
    key: 'reminders',
    label: 'Reminders',
    description: 'Follow-up and deadline reminders',
    icon: <Clock className="h-5 w-5 text-orange-500" />,
  },
  {
    key: 'comments',
    label: 'Comments',
    description: 'New comments on your minutes',
    icon: <MessageSquare className="h-5 w-5 text-teal-500" />,
  },
  {
    key: 'exports',
    label: 'Exports',
    description: 'When exports are ready for download',
    icon: <Download className="h-5 w-5 text-emerald-500" />,
  },
  {
    key: 'system',
    label: 'System',
    description: 'Updates and maintenance notifications',
    icon: <Settings className="h-5 w-5 text-slate-500" />,
  },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

// ============================================================================
// Toggle Component
// ============================================================================

function Toggle({ 
  checked, 
  onChange, 
  disabled,
  size = 'default',
}: { 
  checked: boolean; 
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'small' | 'default';
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex flex-shrink-0 cursor-pointer rounded-full',
        'transition-colors duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2',
        checked ? 'bg-[var(--accent)]' : 'bg-slate-200 dark:bg-slate-700',
        disabled && 'opacity-50 cursor-not-allowed',
        size === 'small' ? 'h-5 w-9' : 'h-6 w-11'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block rounded-full bg-white shadow-sm',
          'transform transition-transform duration-200 ease-in-out',
          size === 'small' ? 'h-4 w-4' : 'h-5 w-5',
          size === 'small'
            ? checked ? 'translate-x-4' : 'translate-x-0.5'
            : checked ? 'translate-x-5' : 'translate-x-0.5',
          'mt-0.5'
        )}
      />
    </button>
  );
}

// ============================================================================
// Category Row Component
// ============================================================================

function CategoryRow({
  config,
  settings,
  onUpdate,
  expanded,
  onToggleExpand,
}: {
  config: typeof CATEGORY_CONFIG[0];
  settings: ChannelSettings;
  onUpdate: (settings: Partial<ChannelSettings>) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const isEnabled = settings.push || settings.inApp || settings.email;

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      {/* Main Row */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          {config.icon}
          <div>
            <h4 className="font-medium text-slate-900 dark:text-slate-100">
              {config.label}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {config.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn(
            'text-xs font-medium px-2 py-0.5 rounded',
            isEnabled 
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
              : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
          )}>
            {isEnabled ? 'On' : 'Off'}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </div>

      {/* Expanded Options */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30"
          >
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Push</span>
                </div>
                <Toggle
                  checked={settings.push}
                  onChange={(checked) => onUpdate({ push: checked })}
                  size="small"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">In-app</span>
                </div>
                <Toggle
                  checked={settings.inApp}
                  onChange={(checked) => onUpdate({ inApp: checked })}
                  size="small"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Email</span>
                </div>
                <Toggle
                  checked={settings.email}
                  onChange={(checked) => onUpdate({ email: checked })}
                  size="small"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function NotificationPreferences({
  isOpen,
  onClose,
  className,
}: NotificationPreferencesProps) {
  const {
    preferences,
    updatePreferences,
    pushEnabled,
    enablePush,
    disablePush,
    pushSupport,
  } = useNotificationContext();

  const [localPreferences, setLocalPreferences] = useState<Preferences | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<CategoryKey | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync local preferences with context
  useEffect(() => {
    if (preferences && isOpen) {
      setLocalPreferences(preferences);
    }
  }, [preferences, isOpen]);

  const handleUpdateLocal = useCallback((updates: Partial<Preferences>) => {
    setLocalPreferences((prev) => prev ? { ...prev, ...updates } : null);
  }, []);

  const handleUpdateCategory = useCallback((category: CategoryKey, settings: Partial<ChannelSettings>) => {
    setLocalPreferences((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        categories: {
          ...prev.categories,
          [category]: {
            ...prev.categories[category],
            ...settings,
          },
        },
      };
    });
  }, []);

  const handleUpdateQuietHours = useCallback((updates: Partial<QuietHours>) => {
    setLocalPreferences((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        quietHours: {
          ...prev.quietHours,
          ...updates,
        },
      };
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!localPreferences) return;
    
    setIsSaving(true);
    try {
      await updatePreferences(localPreferences);
      onClose();
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setIsSaving(false);
    }
  }, [localPreferences, updatePreferences, onClose]);

  const handleTogglePush = useCallback(async () => {
    if (pushEnabled) {
      await disablePush();
    } else {
      await enablePush();
    }
  }, [pushEnabled, enablePush, disablePush]);

  if (!localPreferences) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={cn(
              'fixed right-0 top-0 h-full w-full sm:w-[440px]',
              'bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col',
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-[var(--accent)]" />
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Notification Preferences
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-6">
                {/* Global Settings */}
                <section>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    General
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {localPreferences.globalEnabled ? (
                          <Bell className="h-5 w-5 text-[var(--accent)]" />
                        ) : (
                          <BellOff className="h-5 w-5 text-slate-400" />
                        )}
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-slate-100">
                            All Notifications
                          </h4>
                          <p className="text-xs text-slate-500">
                            Master toggle for all notifications
                          </p>
                        </div>
                      </div>
                      <Toggle
                        checked={localPreferences.globalEnabled}
                        onChange={(checked) => handleUpdateLocal({ globalEnabled: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Smartphone className="h-5 w-5 text-blue-500" />
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-slate-100">
                            Push Notifications
                          </h4>
                          <p className="text-xs text-slate-500">
                            {pushSupport?.supported
                              ? 'Receive notifications when app is closed'
                              : 'Not supported in this browser'}
                          </p>
                        </div>
                      </div>
                      <Toggle
                        checked={pushEnabled}
                        onChange={handleTogglePush}
                        disabled={!pushSupport?.supported}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {localPreferences.soundEnabled ? (
                          <Volume2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <VolumeX className="h-5 w-5 text-slate-400" />
                        )}
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-slate-100">
                            Sound
                          </h4>
                          <p className="text-xs text-slate-500">
                            Play sound for notifications
                          </p>
                        </div>
                      </div>
                      <Toggle
                        checked={localPreferences.soundEnabled}
                        onChange={(checked) => handleUpdateLocal({ soundEnabled: checked })}
                      />
                    </div>
                  </div>
                </section>

                {/* Quiet Hours */}
                <section>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Quiet Hours
                  </h3>
                  <div className="space-y-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Moon className="h-5 w-5 text-indigo-500" />
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-slate-100">
                            Enable Quiet Hours
                          </h4>
                          <p className="text-xs text-slate-500">
                            Silence notifications during specified hours
                          </p>
                        </div>
                      </div>
                      <Toggle
                        checked={localPreferences.quietHours.enabled}
                        onChange={(checked) => handleUpdateQuietHours({ enabled: checked })}
                      />
                    </div>

                    {localPreferences.quietHours.enabled && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-700"
                      >
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                              Start Time
                            </label>
                            <input
                              type="time"
                              value={localPreferences.quietHours.startTime}
                              onChange={(e) => handleUpdateQuietHours({ startTime: e.target.value })}
                              className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">
                              End Time
                            </label>
                            <input
                              type="time"
                              value={localPreferences.quietHours.endTime}
                              onChange={(e) => handleUpdateQuietHours({ endTime: e.target.value })}
                              className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-2">
                            Days
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {DAYS_OF_WEEK.map((day) => (
                              <button
                                key={day.value}
                                onClick={() => {
                                  const days = localPreferences.quietHours.daysOfWeek;
                                  const newDays = days.includes(day.value)
                                    ? days.filter(d => d !== day.value)
                                    : [...days, day.value];
                                  handleUpdateQuietHours({ daysOfWeek: newDays });
                                }}
                                className={cn(
                                  'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                                  localPreferences.quietHours.daysOfWeek.includes(day.value)
                                    ? 'bg-[var(--accent)] text-white'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                )}
                              >
                                {day.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </section>

                {/* Categories */}
                <section>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
                    Categories
                  </h3>
                  <div className="space-y-2">
                    {CATEGORY_CONFIG.map((config) => (
                      <CategoryRow
                        key={config.key}
                        config={config}
                        settings={localPreferences.categories[config.key]}
                        onUpdate={(settings) => handleUpdateCategory(config.key, settings)}
                        expanded={expandedCategory === config.key}
                        onToggleExpand={() => setExpandedCategory(
                          expandedCategory === config.key ? null : config.key
                        )}
                      />
                    ))}
                  </div>
                </section>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-700 p-4">
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default NotificationPreferences;
