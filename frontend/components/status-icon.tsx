import { Badge } from '@/components/ui/badge'
import { JobStatus } from '@/lib/client'
import { CircleCheckBig, CircleX, Loader2 } from 'lucide-react'

export const StatusBadge = ({
  status,
  className,
}: {
  status: JobStatus
  className?: string
}) => {
  // Processing states - Orange with animation
  if (['awaiting_start', 'in_progress'].includes(status)) {
    return (
      <Badge
        variant="outline"
        className={`${className} bg-accent-alt/10 border-accent-alt/40 text-accent-alt hover:bg-accent-alt/20 transition-colors`}
      >
        <Loader2 className="animate-spin h-3 w-3 mr-1" />
        <p className="text-xs font-medium">Processing</p>
      </Badge>
    )
  }

  // Completed state - Green with success styling
  if (status === 'completed') {
    return (
      <Badge
        variant="outline"
        className={`${className} bg-secondary/10 border-secondary/40 text-secondary hover:bg-secondary/20 transition-colors`}
      >
        <CircleCheckBig className="h-3 w-3 mr-1" />
        <p className="text-xs font-medium">Completed</p>
      </Badge>
    )
  }

  // Failed state - Red with error styling
  if (status === 'failed') {
    return (
      <Badge
        variant="outline"
        className={`${className} bg-red-50 border-red-300 text-red-700 hover:bg-red-100 transition-colors`}
      >
        <CircleX className="h-3 w-3 mr-1" />
        <p className="text-xs font-medium">Failed</p>
      </Badge>
    )
  }

  // Default fallback
  return (
    <Badge variant="outline" className={className}>
      <p className="text-xs font-medium">{status}</p>
    </Badge>
  )
}
