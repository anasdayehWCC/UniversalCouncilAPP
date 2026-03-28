'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import { NavItem } from './NavItem';
import type { NavSection as NavSectionType, NavItem as NavItemType } from '@/lib/navigation';

interface NavSectionProps {
  section: NavSectionType;
  isCollapsed?: boolean;
  defaultExpanded?: boolean;
  onItemSelect?: (item: NavItemType) => void;
}

/**
 * NavSection Component
 * 
 * A collapsible section of navigation items with:
 * - Header with title and optional icon
 * - Smooth expand/collapse animation
 * - Child item rendering
 */
export function NavSection({
  section,
  isCollapsed = false,
  defaultExpanded = true,
  onItemSelect,
}: NavSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(
    section.defaultCollapsed ? false : defaultExpanded
  );
  const Icon = section.icon;

  const handleHeaderClick = () => {
    if (section.collapsible !== false) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="space-y-1">
      {/* Section Header */}
      <button
        onClick={handleHeaderClick}
        disabled={section.collapsible === false}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors',
          'text-white/60 text-xs font-semibold uppercase tracking-wider',
          section.collapsible !== false && 'hover:text-white/80 cursor-pointer',
          isCollapsed && 'justify-center',
        )}
        aria-expanded={isExpanded}
        aria-controls={`section-${section.id}`}
      >
        {/* Section Icon */}
        {Icon && isCollapsed && (
          <Icon className="h-4 w-4" />
        )}

        {/* Section Title */}
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left">{section.title}</span>
            {section.collapsible !== false && (
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 transition-transform duration-200',
                  !isExpanded && '-rotate-90',
                )}
              />
            )}
          </>
        )}
      </button>

      {/* Section Items */}
      <div
        id={`section-${section.id}`}
        className={cn(
          'space-y-0.5 overflow-hidden transition-all duration-200',
          !isExpanded && !isCollapsed && 'hidden',
        )}
      >
        {section.items.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isCollapsed={isCollapsed}
            onSelect={onItemSelect}
          />
        ))}
      </div>
    </div>
  );
}

export default NavSection;
