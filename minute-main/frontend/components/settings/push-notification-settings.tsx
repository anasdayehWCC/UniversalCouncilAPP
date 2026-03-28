'use client'

import { usePushNotifications } from '@/hooks/use-push-notifications'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Badge, Label } from '@careminutes/ui'
import { Bell, BellOff, AlertTriangle, Check, X } from 'lucide-react'

/**
 * Push Notification Settings Component
 * Can be used in settings page or as a standalone card
 */
export function PushNotificationSettings() {
  const {
    isSupported,
    isSubscribed,
    permissionState,
    loading,
    error,
    toggle,
  } = usePushNotifications()

  if (!isSupported) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Notifications Unavailable
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in this browser. Try using the latest
            version of Chrome, Firefox, Safari, or Edge.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get notified when your recordings finish processing, minutes are ready, or
          offline uploads complete.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Permission Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Browser Permission</span>
          <PermissionBadge state={permissionState} />
        </div>

        {/* Subscription Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="push-toggle" className="text-sm font-medium">
              Enable Notifications
            </Label>
            <p className="text-xs text-muted-foreground">
              {isSubscribed
                ? 'You will receive push notifications'
                : 'Enable to receive push notifications'}
            </p>
          </div>
          <Button
            id="push-toggle"
            variant={isSubscribed ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggle()}
            disabled={loading || permissionState === 'denied'}
          >
            {isSubscribed ? 'On' : 'Off'}
          </Button>
        </div>

        {/* Permission Denied Warning */}
        {permissionState === 'denied' && (
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                Notifications Blocked
              </p>
              <p className="text-xs text-muted-foreground">
                You&apos;ve blocked notifications. To enable them, update your browser
                settings for this site.
              </p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 rounded-lg">
            <X className="h-4 w-4 text-red-500 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Success State */}
        {isSubscribed && !error && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg">
            <Check className="h-4 w-4 text-green-500" />
            <p className="text-sm text-green-700 dark:text-green-400">
              Notifications enabled - you&apos;ll be notified of important updates
            </p>
          </div>
        )}

        {/* Manual Enable Button (for initial setup) */}
        {!isSubscribed && permissionState !== 'denied' && (
          <Button
            onClick={toggle}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? 'Enabling...' : 'Enable Push Notifications'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function PermissionBadge({ state }: { state: NotificationPermission | 'unsupported' }) {
  switch (state) {
    case 'granted':
      return (
        <Badge variant="default" className="bg-green-500/20 text-green-700 dark:text-green-400">
          <Check className="h-3 w-3 mr-1" />
          Granted
        </Badge>
      )
    case 'denied':
      return (
        <Badge variant="warning" className="bg-red-500/20 text-red-700 dark:text-red-400">
          <X className="h-3 w-3 mr-1" />
          Denied
        </Badge>
      )
    case 'default':
      return (
        <Badge variant="secondary">
          Not Set
        </Badge>
      )
    default:
      return (
        <Badge variant="outline">
          Unsupported
        </Badge>
      )
  }
}

export default PushNotificationSettings
