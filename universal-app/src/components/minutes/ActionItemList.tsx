'use client';

import React, { useState } from 'react';
import { 
  ActionItem, 
  ActionPriority, 
  ActionStatus,
  ACTION_PRIORITY_CONFIG,
  ACTION_STATUS_CONFIG
} from '@/lib/minutes/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  Flag,
  CheckCircle,
  Circle,
  Clock,
  X,
  ChevronDown,
  GripVertical
} from 'lucide-react';

interface ActionItemListProps {
  items: ActionItem[];
  isEditing?: boolean;
  onAdd?: (item: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate?: (itemId: string, updates: Partial<ActionItem>) => void;
  onRemove?: (itemId: string) => void;
  className?: string;
}

interface ActionItemRowProps {
  item: ActionItem;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<ActionItem>) => void;
  onRemove?: () => void;
}

function ActionItemRow({ item, isEditing, onUpdate, onRemove }: ActionItemRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const priorityConfig = ACTION_PRIORITY_CONFIG[item.priority];
  const statusConfig = ACTION_STATUS_CONFIG[item.status];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: 'Overdue', isOverdue: true };
    } else if (diffDays === 0) {
      return { text: 'Today', isOverdue: false };
    } else if (diffDays === 1) {
      return { text: 'Tomorrow', isOverdue: false };
    } else if (diffDays <= 7) {
      return { text: `${diffDays} days`, isOverdue: false };
    } else {
      return { text: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), isOverdue: false };
    }
  };

  const dateInfo = formatDate(item.dueDate);

  const StatusIcon = item.status === 'completed' 
    ? CheckCircle 
    : item.status === 'in_progress' 
      ? Clock 
      : item.status === 'cancelled'
        ? X
        : Circle;

  return (
    <div
      className={cn(
        'group rounded-lg border transition-all duration-200',
        'bg-card',
        item.status === 'completed' 
          ? 'border-success/30 bg-success/5'
          : item.status === 'cancelled'
            ? 'border-border opacity-60'
            : 'border-border hover:border-input'
      )}
    >
      <div className="flex items-start gap-3 p-3">
        {/* Drag Handle */}
        {isEditing && (
          <div className="mt-0.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
            <GripVertical className="w-4 h-4" />
          </div>
        )}

        {/* Status Checkbox */}
        <button
          onClick={() => {
            if (!isEditing) return;
            const nextStatus: ActionStatus = 
              item.status === 'pending' ? 'in_progress' :
              item.status === 'in_progress' ? 'completed' :
              item.status === 'completed' ? 'pending' : 'pending';
            onUpdate?.({ status: nextStatus });
          }}
          className={cn(
            'mt-0.5 flex-shrink-0',
            isEditing ? 'cursor-pointer' : 'cursor-default',
            statusConfig.color
          )}
        >
          <StatusIcon className={cn(
            'w-5 h-5',
            item.status === 'completed' && 'text-emerald-500'
          )} />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={item.description}
              onChange={(e) => onUpdate?.({ description: e.target.value })}
              className={cn(
                'w-full bg-transparent border-none outline-none text-sm font-medium',
              'text-foreground',
              'placeholder:text-muted-foreground',
              item.status === 'completed' && 'line-through text-muted-foreground'
              )}
              placeholder="Enter action item..."
            />
          ) : (
            <p className={cn(
              'text-sm font-medium text-foreground',
              item.status === 'completed' && 'line-through text-muted-foreground'
            )}>
              {item.description}
            </p>
          )}

          {/* Metadata Row */}
          <div className="flex items-center flex-wrap gap-2 mt-2">
            {/* Assignee */}
            <div className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
              'bg-muted text-muted-foreground'
            )}>
              <User className="w-3 h-3" />
              {isEditing ? (
                <input
                  type="text"
                  value={item.assignee}
                  onChange={(e) => onUpdate?.({ assignee: e.target.value })}
                  className="w-24 bg-transparent border-none outline-none"
                  placeholder="Assignee"
                />
              ) : (
                <span>{item.assignee}</span>
              )}
            </div>

            {/* Due Date */}
            <div className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
              dateInfo.isOverdue 
                ? 'bg-destructive/10 text-destructive' 
                : 'bg-muted text-muted-foreground'
            )}>
              <Calendar className="w-3 h-3" />
              {isEditing ? (
                <input
                  type="date"
                  value={item.dueDate.split('T')[0]}
                  onChange={(e) => onUpdate?.({ dueDate: new Date(e.target.value).toISOString() })}
                  className="bg-transparent border-none outline-none"
                />
              ) : (
                <span>{dateInfo.text}</span>
              )}
            </div>

            {/* Priority */}
            <Badge
              className={cn(
                'text-xs cursor-pointer',
                priorityConfig.bgColor,
                priorityConfig.color,
                priorityConfig.borderColor
              )}
              onClick={() => {
                if (!isEditing) return;
                const priorities: ActionPriority[] = ['low', 'medium', 'high', 'urgent'];
                const currentIndex = priorities.indexOf(item.priority);
                const nextPriority = priorities[(currentIndex + 1) % priorities.length];
                onUpdate?.({ priority: nextPriority });
              }}
            >
              <Flag className="w-3 h-3 mr-1" />
              {priorityConfig.label}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        {isEditing && (
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={onRemove}
            aria-label="Remove action item"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}

        {/* Expand Toggle (for evidence/notes) */}
        {item.evidence && item.evidence.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Collapse evidence' : 'Expand evidence'}
            aria-expanded={isExpanded}
          >
            <ChevronDown className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} />
          </Button>
        )}
      </div>

      {/* Expanded Evidence */}
      {isExpanded && item.evidence && item.evidence.length > 0 && (
        <div className="px-4 py-3 border-t border-border/50 bg-muted/30">
          <p className="text-xs font-medium text-muted-foreground mb-2">Supporting Evidence:</p>
          {item.evidence.map((ev) => (
            <p key={ev.id} className="text-xs text-muted-foreground italic">
              "{ev.text}"
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function ActionItemList({
  items,
  isEditing = false,
  onAdd,
  onUpdate,
  onRemove,
  className
}: ActionItemListProps) {
  const [showAddForm, setShowAddForm] = useState(false);

  const completedCount = items.filter(i => i.status === 'completed').length;
  const pendingCount = items.filter(i => i.status === 'pending' || i.status === 'in_progress').length;

  const handleAddItem = () => {
    onAdd?.({
      description: 'New action item',
      assignee: '',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      priority: 'medium',
      status: 'pending'
    });
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-foreground">
            Action Items
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              {completedCount} completed
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Circle className="w-3 h-3 text-muted-foreground" />
              {pendingCount} pending
            </span>
          </div>
        </div>

        {isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddItem}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Action
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      {items.length > 0 && (
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${(completedCount / items.length) * 100}%` }}
          />
        </div>
      )}

      {/* Items List */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No action items yet.
            {isEditing && (
              <Button
                variant="link"
                size="sm"
                className="ml-1"
                onClick={handleAddItem}
              >
                Add one
              </Button>
            )}
          </div>
        ) : (
          items.map((item) => (
            <ActionItemRow
              key={item.id}
              item={item}
              isEditing={isEditing}
              onUpdate={(updates) => onUpdate?.(item.id, updates)}
              onRemove={() => onRemove?.(item.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
