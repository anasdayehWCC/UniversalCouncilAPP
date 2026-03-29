'use client';

import React from 'react';
import { Sparkles, Wand2, AlignLeft, Star, EyeOff, Pen, Send } from 'lucide-react';

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

export function AIEditSidebar() {
  return (
    <aside className="w-80 shrink-0 fixed right-0 top-[var(--shell-header-height)] h-[calc(100dvh-var(--shell-header-height))] flex flex-col bg-card border-l border-border shadow-xl overflow-y-auto z-30">
      {/* Panel header */}
      <div className="px-4 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-2 text-primary mb-1">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">AI Assistant</span>
        </div>
        <p className="text-base font-semibold text-foreground">Edit with AI</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Select text in the summary to see context-aware actions.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="px-4 pt-2">
        <SectionHeader label="Quick Actions" />
        <div className="flex flex-col gap-1.5 pt-2">
          <ActionButton icon={<Wand2 className="w-4 h-4" />} label="Make more professional" />
          <ActionButton icon={<AlignLeft className="w-4 h-4" />} label="Summarize selection" />
          <ActionButton icon={<Pen className="w-4 h-4" />} label="Fix grammar & spelling" />
        </div>
      </div>

      {/* Social Care Specific */}
      <div className="px-4 pt-1">
        <SectionHeader label="Social Care Specific" />
        <div className="flex flex-col gap-1.5 pt-2">
          <ActionButton icon={<Star className="w-4 h-4" />} label="Make strengths-based" />
          <ActionButton icon={<EyeOff className="w-4 h-4" />} label="Anonymize names" />
        </div>
      </div>

      {/* Custom Instruction */}
      <div className="px-4 pt-1 pb-6">
        <SectionHeader label="Custom Instruction" />
        <div className="pt-3 flex flex-col gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            Custom instruction
          </label>
          <textarea
            placeholder="e.g. 'Rewrite this to focus on the child's voice'"
            className="w-full min-h-[80px] px-3 py-2 text-sm bg-muted/50 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground"
          />
          <button className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Send className="w-3.5 h-3.5" />
            Apply
          </button>
        </div>
      </div>
    </aside>
  );
}
