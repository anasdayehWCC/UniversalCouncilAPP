'use client';

import { cn } from '@/lib/utils';
import { Skeleton, SkeletonInput, SkeletonTextarea, type SkeletonProps } from '@/components/ui/skeleton';

export interface FormSkeletonProps extends SkeletonProps {
  /** Number of fields */
  fields?: number;
  /** Include submit button */
  withSubmit?: boolean;
  /** Form layout */
  layout?: 'vertical' | 'horizontal' | 'inline';
  /** Include form sections */
  sections?: number;
}

/**
 * Form skeleton with configurable fields
 */
export function FormSkeleton({ 
  className, 
  fields = 4,
  withSubmit = true,
  layout = 'vertical',
  sections = 1,
  shimmer 
}: FormSkeletonProps) {
  const fieldsPerSection = Math.ceil(fields / sections);

  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: sections }).map((_, sectionIdx) => (
        <FormSectionSkeleton
          key={sectionIdx}
          shimmer={shimmer}
          fields={fieldsPerSection}
          layout={layout}
          title={sections > 1}
        />
      ))}

      {withSubmit && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Skeleton shimmer={shimmer} className="h-10 w-24 rounded-lg" />
          <Skeleton shimmer={shimmer} className="h-10 w-32 rounded-lg" />
        </div>
      )}
    </div>
  );
}

/**
 * Form section skeleton
 */
export function FormSectionSkeleton({ 
  shimmer, 
  className,
  fields = 4,
  layout = 'vertical',
  title = true,
}: SkeletonProps & { 
  fields?: number; 
  layout?: 'vertical' | 'horizontal' | 'inline';
  title?: boolean;
}) {
  return (
    <div className={cn('space-y-4', className)}>
      {title && (
        <div className="space-y-1 pb-2 border-b">
          <Skeleton shimmer={shimmer} className="h-6 w-36" />
          <Skeleton shimmer={shimmer} className="h-4 w-64" />
        </div>
      )}

      <div className={cn({
        'space-y-4': layout === 'vertical',
        'grid grid-cols-2 gap-4': layout === 'horizontal',
        'flex flex-wrap gap-4': layout === 'inline',
      })}>
        {Array.from({ length: fields }).map((_, i) => (
          <FormFieldSkeleton 
            key={i} 
            shimmer={shimmer}
            // Vary field types
            type={i === fields - 1 ? 'textarea' : i === 2 ? 'select' : 'input'}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Single form field skeleton
 */
export function FormFieldSkeleton({ 
  shimmer, 
  className,
  type = 'input',
}: SkeletonProps & { 
  type?: 'input' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'switch';
}) {
  switch (type) {
    case 'textarea':
      return <SkeletonTextarea shimmer={shimmer} className={className} />;
    
    case 'select':
      return (
        <div className={cn('space-y-2', className)}>
          <Skeleton shimmer={shimmer} className="h-4 w-24" />
          <div className="relative">
            <Skeleton shimmer={shimmer} className="h-10 w-full rounded-lg" />
            <Skeleton shimmer={shimmer} className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4" />
          </div>
        </div>
      );
    
    case 'checkbox':
    case 'switch':
      return (
        <div className={cn('flex items-center gap-3', className)}>
          <Skeleton shimmer={shimmer} className={cn(
            type === 'switch' ? 'h-6 w-11 rounded-full' : 'h-5 w-5 rounded'
          )} />
          <Skeleton shimmer={shimmer} className="h-4 w-32" />
        </div>
      );
    
    case 'radio':
      return (
        <div className={cn('space-y-2', className)}>
          <Skeleton shimmer={shimmer} className="h-4 w-24" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton shimmer={shimmer} className="h-5 w-5 rounded-full" />
                <Skeleton shimmer={shimmer} className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      );
    
    default:
      return <SkeletonInput shimmer={shimmer} className={className} />;
  }
}

/**
 * Login/auth form skeleton
 */
export function AuthFormSkeleton({ shimmer, className }: SkeletonProps) {
  return (
    <div className={cn('w-full max-w-sm space-y-6', className)}>
      {/* Logo */}
      <div className="flex flex-col items-center gap-2">
        <Skeleton shimmer={shimmer} className="h-12 w-12 rounded-xl" />
        <Skeleton shimmer={shimmer} className="h-6 w-32" />
      </div>

      {/* Form */}
      <div className="space-y-4">
        <SkeletonInput shimmer={shimmer} />
        <SkeletonInput shimmer={shimmer} />
        <Skeleton shimmer={shimmer} className="h-10 w-full rounded-lg" />
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <Skeleton shimmer={shimmer} className="h-px flex-1" />
        <Skeleton shimmer={shimmer} className="h-4 w-8" />
        <Skeleton shimmer={shimmer} className="h-px flex-1" />
      </div>

      {/* Social */}
      <div className="flex flex-col gap-3">
        <Skeleton shimmer={shimmer} className="h-10 w-full rounded-lg" />
        <Skeleton shimmer={shimmer} className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Settings form skeleton
 */
export function SettingsFormSkeleton({ shimmer, className }: SkeletonProps) {
  return (
    <div className={cn('space-y-8', className)}>
      {/* Profile section */}
      <div className="space-y-4 p-6 rounded-xl border bg-card">
        <Skeleton shimmer={shimmer} className="h-6 w-28" />
        <div className="flex items-center gap-4">
          <Skeleton shimmer={shimmer} className="h-20 w-20 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton shimmer={shimmer} className="h-10 w-32 rounded-lg" />
            <Skeleton shimmer={shimmer} className="h-4 w-48" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <SkeletonInput shimmer={shimmer} />
          <SkeletonInput shimmer={shimmer} />
        </div>
      </div>

      {/* Preferences section */}
      <div className="space-y-4 p-6 rounded-xl border bg-card">
        <Skeleton shimmer={shimmer} className="h-6 w-32" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton shimmer={shimmer} className="h-4 w-36" />
                <Skeleton shimmer={shimmer} className="h-3 w-48" />
              </div>
              <Skeleton shimmer={shimmer} className="h-6 w-11 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <Skeleton shimmer={shimmer} className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}
