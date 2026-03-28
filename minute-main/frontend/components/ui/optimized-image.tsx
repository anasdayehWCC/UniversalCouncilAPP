'use client'

import Image, { ImageProps } from 'next/image'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps extends Omit<ImageProps, 'onLoadingComplete'> {
  /** Alt text for accessibility (required) */
  alt: string
  /** Whether to show a shimmer effect while loading */
  shimmer?: boolean
  /** Custom fallback content while loading */
  fallback?: React.ReactNode
  /** Whether to fade in the image after loading */
  fadeIn?: boolean
  /** Duration of fade-in animation in ms */
  fadeInDuration?: number
}

/**
 * Optimized Image component with loading states and animations
 * 
 * Features:
 * - Automatic format detection (AVIF/WebP)
 * - Shimmer loading effect
 * - Fade-in animation
 * - Blur placeholder support
 * - Responsive sizing
 */
export function OptimizedImage({
  shimmer = true,
  fallback,
  fadeIn = true,
  fadeInDuration = 300,
  className,
  alt,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Reset loading state when src changes
  useEffect(() => {
    setIsLoading(true)
    setHasError(false)
  }, [props.src])

  if (hasError) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground',
          className
        )}
        style={{ width: props.width, height: props.height }}
      >
        {fallback || <span className="text-sm">Failed to load</span>}
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Shimmer overlay */}
      {shimmer && isLoading && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
          style={{ 
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
      )}
      
      {/* Actual image */}
      <Image
        {...props}
        alt={alt}
        className={cn(
          fadeIn && 'transition-opacity',
          isLoading && fadeIn ? 'opacity-0' : 'opacity-100',
        )}
        style={{
          transitionDuration: `${fadeInDuration}ms`,
          ...props.style,
        }}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
      />
    </div>
  )
}

/**
 * Container for responsive images that maintains aspect ratio
 */
export function AspectRatioImage({
  ratio = 16 / 9,
  className,
  ...props
}: OptimizedImageProps & { ratio?: number }) {
  return (
    <div 
      className={cn('relative', className)}
      style={{ paddingBottom: `${(1 / ratio) * 100}%` }}
    >
      <OptimizedImage
        {...props}
        fill
        className="absolute inset-0 object-cover"
      />
    </div>
  )
}

/**
 * Avatar-style circular image
 */
export function AvatarImage({
  size = 40,
  className,
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height'> & { size?: number }) {
  return (
    <OptimizedImage
      {...props}
      width={size}
      height={size}
      className={cn('rounded-full object-cover', className)}
    />
  )
}

/**
 * Full-width banner image with blur-up effect
 */
export function BannerImage({
  className,
  ...props
}: Omit<OptimizedImageProps, 'fill'>) {
  return (
    <div className={cn('relative w-full h-48 md:h-64 lg:h-80', className)}>
      <OptimizedImage
        {...props}
        fill
        className="object-cover"
        sizes="100vw"
      />
    </div>
  )
}

export default OptimizedImage
