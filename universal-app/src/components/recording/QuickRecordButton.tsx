'use client';

/**
 * Quick Record Button
 *
 * Floating action button for quick recording start.
 *
 * @module components/recording/QuickRecordButton
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Mic, X, FileText, Folder, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemo } from '@/context/DemoContext';

interface QuickRecordButtonProps {
  /** Position of the FAB */
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  /** Whether to show quick actions menu */
  showQuickActions?: boolean;
  /** Additional className */
  className?: string;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  description: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'record',
    label: 'New Recording',
    icon: Mic,
    href: '/record',
    description: 'Start a new meeting recording',
  },
  {
    id: 'upload',
    label: 'Upload Audio',
    icon: Folder,
    href: '/upload',
    description: 'Upload an existing recording',
  },
  {
    id: 'recent',
    label: 'Recent Notes',
    icon: Clock,
    href: '/my-notes',
    description: 'View your recent notes',
  },
  {
    id: 'templates',
    label: 'Templates',
    icon: FileText,
    href: '/templates',
    description: 'Browse minute templates',
  },
];

export function QuickRecordButton({
  position = 'bottom-right',
  showQuickActions = true,
  className,
}: QuickRecordButtonProps) {
  const router = useRouter();
  const { currentUser } = useDemo();
  const [isExpanded, setIsExpanded] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2',
  };

  const handleMainClick = () => {
    if (showQuickActions) {
      setIsExpanded(!isExpanded);
    } else {
      router.push('/record');
    }
  };

  const handleActionClick = (action: QuickAction) => {
    setIsExpanded(false);
    router.push(action.href);
  };

  // Only show for social workers and housing officers
  const allowedRoles = ['social_worker', 'housing_officer'];
  if (!allowedRoles.includes(currentUser.role)) {
    return null;
  }

  return (
    <div className={cn('fixed z-50', positionClasses[position], className)}>
      {/* Backdrop */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>

      {/* Quick Actions Menu */}
      <AnimatePresence>
        {isExpanded && showQuickActions && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'absolute bottom-20 right-0',
              'w-64',
              'rounded-2xl overflow-hidden',
              'bg-white/90 dark:bg-slate-900/90',
              'backdrop-blur-xl',
              'border border-white/30 dark:border-slate-700/50',
              'shadow-xl'
            )}
          >
            <div className="p-2 space-y-1">
              {QUICK_ACTIONS.map((action, index) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleActionClick(action)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl',
                      'transition-colors duration-150',
                      'hover:bg-primary/10',
                      action.id === 'record' && 'bg-red-500/5'
                    )}
                  >
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        action.id === 'record'
                          ? 'bg-red-500/20'
                          : 'bg-primary/10'
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-5 h-5',
                          action.id === 'record' ? 'text-red-500' : 'text-primary'
                        )}
                      />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium">{action.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleMainClick}
        className={cn(
          'relative w-16 h-16 rounded-full',
          'flex items-center justify-center',
          'shadow-lg shadow-red-500/30',
          'transition-all duration-300',
          isExpanded
            ? 'bg-slate-900 dark:bg-slate-700'
            : 'bg-linear-to-br from-red-500 to-red-600 hover:shadow-xl hover:shadow-red-500/40'
        )}
        aria-label={isExpanded ? 'Close menu' : 'Quick actions'}
      >
        <motion.div
          animate={{ rotate: isExpanded ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isExpanded ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-7 h-7 text-white" />
          )}
        </motion.div>

        {/* Pulse animation when not expanded */}
        {!isExpanded && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-red-400/50"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Label */}
      {!isExpanded && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
        >
          <span
            className={cn(
              'px-2 py-1 rounded-lg text-xs font-medium',
              'bg-slate-900/80 text-white',
              'shadow-lg'
            )}
          >
            Quick Record
          </span>
        </motion.div>
      )}
    </div>
  );
}

export default QuickRecordButton;
