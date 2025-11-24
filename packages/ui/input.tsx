'use client';

import * as React from 'react';
import { cn } from './utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type = 'text', ...props }, ref) => (
  <input
    type={type}
    className={cn(
      'flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
      className
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = 'Input';
