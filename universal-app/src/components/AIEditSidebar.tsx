'use client';

import React from 'react';
import { Sparkles, Wand2, AlignLeft, Star, EyeOff, Pen, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InspectorPanel, InspectorSurface } from '@/components/layout';

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

function ActionButton({ icon, label, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg border border-border bg-muted/50 hover:bg-muted text-sm text-foreground transition-colors text-left group"
    >
      <span className="text-muted-foreground group-hover:text-primary transition-colors shrink-0">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

interface SectionHeaderProps {
  label: string;
}

function SectionHeader({ label }: SectionHeaderProps) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase px-0 pt-4 pb-2">
        {label}
      </p>
      <div className="h-px bg-border" />
    </div>
  );
}

export function AIEditSidebar({ className }: { className?: string }) {
  return (
    <InspectorSurface
      className={cn(
        'flex min-h-[28rem] flex-col overflow-hidden p-0',
        className
      )}
    >
      <InspectorPanel
        title="Edit with AI"
        description="Select text in the summary to unlock context-aware guidance and drafting actions."
        className="px-5 pt-5"
        actions={
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-4 h-4" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em]">AI Assistant</span>
          </div>
        }
      >

      </InspectorPanel>

      <div className="flex-1 space-y-1 overflow-y-auto px-5 pb-5">
        <div className="pt-2">
          <SectionHeader label="Quick Actions" />
          <div className="flex flex-col gap-1.5 pt-2">
            <ActionButton icon={<Wand2 className="w-4 h-4" />} label="Make more professional" />
            <ActionButton icon={<AlignLeft className="w-4 h-4" />} label="Summarize selection" />
            <ActionButton icon={<Pen className="w-4 h-4" />} label="Fix grammar & spelling" />
          </div>
        </div>

        <div className="pt-1">
          <SectionHeader label="Social Care Specific" />
          <div className="flex flex-col gap-1.5 pt-2">
            <ActionButton icon={<Star className="w-4 h-4" />} label="Make strengths-based" />
            <ActionButton icon={<EyeOff className="w-4 h-4" />} label="Anonymize names" />
          </div>
        </div>

        <div className="pt-1 pb-2">
          <SectionHeader label="Custom Instruction" />
          <div className="flex flex-col gap-2 pt-3">
            <label className="text-xs font-medium text-muted-foreground">
              Custom instruction
            </label>
            <textarea
              placeholder="e.g. 'Rewrite this to focus on the child's voice'"
              className="min-h-[96px] w-full resize-none rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
              <Send className="w-3.5 h-3.5" />
              Apply
            </button>
          </div>
        </div>
      </div>
    </InspectorSurface>
  );
}
