'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import type { NavItem as NavItemType } from '@/lib/navigation';

interface NavItemProps {
  item: NavItemType;
  isActive?: boolean;
  isCollapsed?: boolean;
  depth?: number;
  onSelect?: (item: NavItemType) => void;
}

/**
 * NavItem Component
 * 
 * Individual navigation item with support for:
 * - Active state highlighting
 * - Nested children
 * - Icons and badges
 * - Premium styling with glass effects
 */
export function NavItem({
  item,
  isActive = false,
  isCollapsed = false,
  depth = 0,
  onSelect,
}: NavItemProps) {
  const pathname = usePathname();
  const Icon = item.icon;
  const [isExpanded, setIsExpanded] = React.useState(false);
  const hasChildren = item.children && item.children.length > 0;
  
  const isCurrentPath = pathname === item.href || 
    (item.href !== '/' && pathname.startsWith(item.href));
  const activeState = isActive || isCurrentPath;

  const handleClick = (e: React.MouseEvent) => {
    if (item.disabled) {
      e.preventDefault();
      return;
    }
    
    if (hasChildren) {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    }
    
    onSelect?.(item);
  };

  const content = (
    <div
      className={cn(
        // Base styles
        'group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer',
        // Depth-based indentation
        depth > 0 && 'ml-4',
        // Hover styles (dark sidebar)
        'hover:bg-white/10',
        // Active state
        activeState && [
          'bg-white/15 shadow-sm',
          'before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2',
          'before:w-1 before:h-6 before:bg-white before:rounded-r-full',
          'relative',
        ],
        // Disabled state
        item.disabled && 'opacity-50 cursor-not-allowed',
      )}
      onClick={handleClick}
      role="button"
      tabIndex={item.disabled ? -1 : 0}
      aria-disabled={item.disabled}
      title={item.disabled ? item.disabledReason : item.description}
    >
      {/* Icon */}
      {Icon && (
        <Icon
          className={cn(
            'h-5 w-5 shrink-0 transition-colors',
            activeState ? 'text-white' : 'text-white/70 group-hover:text-white',
          )}
        />
      )}

      {/* Label and description */}
      {!isCollapsed && (
        <div className="flex-1 min-w-0">
          <div className={cn(
            'text-sm font-medium truncate transition-colors',
            activeState ? 'text-white' : 'text-white/90 group-hover:text-white',
          )}>
            {item.label}
          </div>
          {item.description && depth === 0 && (
            <div className="text-xs text-white/50 truncate">
              {item.description}
            </div>
          )}
        </div>
      )}

      {/* Badge */}
      {item.badge && !isCollapsed && (
        <span
          className={cn(
            'px-1.5 py-0.5 text-[10px] font-semibold rounded-full',
            item.badgeVariant === 'success' && 'bg-emerald-500/20 text-emerald-300',
            item.badgeVariant === 'warning' && 'bg-amber-500/20 text-amber-300',
            item.badgeVariant === 'danger' && 'bg-red-500/20 text-red-300',
            item.badgeVariant === 'info' && 'bg-blue-500/20 text-blue-300',
            (!item.badgeVariant || item.badgeVariant === 'default') && 'bg-white/10 text-white/80',
          )}
        >
          {item.badge}
        </span>
      )}

      {/* Expand indicator for items with children */}
      {hasChildren && !isCollapsed && (
        <ChevronRight
          className={cn(
            'h-4 w-4 text-white/50 transition-transform duration-200',
            isExpanded && 'rotate-90',
          )}
        />
      )}
    </div>
  );

  // Render as link or div
  const itemElement = item.disabled || hasChildren ? (
    content
  ) : (
    <Link
      href={item.href}
      target={item.external ? '_blank' : undefined}
      rel={item.external ? 'noopener noreferrer' : undefined}
      className="block"
    >
      {content}
    </Link>
  );

  return (
    <div>
      {itemElement}
      
      {/* Nested children */}
      {hasChildren && isExpanded && !isCollapsed && (
        <div className="mt-1 space-y-0.5 animate-in fade-in-50 slide-in-from-top-2 duration-200">
          {item.children?.map((child) => (
            <NavItem
              key={child.id}
              item={child}
              depth={depth + 1}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default NavItem;
