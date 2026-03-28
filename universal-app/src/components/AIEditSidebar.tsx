'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { EnhancedInput } from '@/components/ui/EnhancedInput';
import { Sparkles, Wand2, SpellCheck, AlignLeft, Eraser } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AIEditSidebar() {
  return (
    <Card className="h-full border-l border-slate-200 rounded-none border-y-0 border-r-0 shadow-none bg-slate-50/50">
      <CardHeader>
        <div className="flex items-center gap-2 text-purple-600 mb-1">
          <Sparkles className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">AI Assistant</span>
        </div>
        <CardTitle className="text-lg">Edit with AI</CardTitle>
        <CardDescription>
          Select text in the summary to see context-aware actions.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase">Quick Actions</p>
          <Button variant="outline" className="w-full justify-start gap-2 bg-white hover:border-purple-200 hover:text-purple-700 transition-colors">
            <Wand2 className="w-4 h-4" />
            Make more professional
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2 bg-white hover:border-purple-200 hover:text-purple-700 transition-colors">
            <AlignLeft className="w-4 h-4" />
            Summarize selection
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2 bg-white hover:border-purple-200 hover:text-purple-700 transition-colors">
            <SpellCheck className="w-4 h-4" />
            Fix grammar & spelling
          </Button>
        </div>

        <div className="space-y-2 pt-4 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase">Social Care Specific</p>
          <Button variant="outline" className="w-full justify-start gap-2 bg-white hover:border-blue-200 hover:text-blue-700 transition-colors">
            <Sparkles className="w-4 h-4" />
            Make strengths-based
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2 bg-white hover:border-blue-200 hover:text-blue-700 transition-colors">
            <Eraser className="w-4 h-4" />
            Anonymize names
          </Button>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Custom Instruction</p>
          <EnhancedInput 
            placeholder="e.g. 'Rewrite this to focus on the child's voice'" 
            className="bg-white"
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
}
