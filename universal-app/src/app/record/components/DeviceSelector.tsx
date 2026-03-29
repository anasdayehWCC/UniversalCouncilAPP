'use client';

/**
 * Device Selector
 *
 * Microphone selection dropdown with permission handling.
 *
 * @module app/record/components/DeviceSelector
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, ChevronDown, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { AudioDevice, AudioPermissionStatus } from '@/lib/audio/types';

interface DeviceSelectorProps {
  /** Available devices */
  devices: AudioDevice[];
  /** Currently selected device ID */
  selectedDeviceId: string;
  /** Permission status */
  permission: AudioPermissionStatus;
  /** Device selection callback */
  onSelectDevice: (deviceId: string) => void;
  /** Request permission callback */
  onRequestPermission: () => Promise<AudioPermissionStatus>;
  /** Refresh devices callback */
  onRefreshDevices: () => Promise<void>;
  /** Whether selector is disabled */
  disabled?: boolean;
}

export function DeviceSelector({
  devices,
  selectedDeviceId,
  permission,
  onSelectDevice,
  onRequestPermission,
  onRefreshDevices,
  disabled = false,
}: DeviceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedDevice = devices.find((d) => d.deviceId === selectedDeviceId);
  const hasPermission = permission.state === 'granted';
  const isDenied = permission.state === 'denied';

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshDevices();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Permission denied state
  if (isDenied) {
    return (
      <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
        <div className="flex items-center gap-2 text-destructive">
          <MicOff className="w-5 h-5" />
          <span className="text-sm font-medium">Microphone Access Denied</span>
        </div>
        <p className="text-xs text-center text-muted-foreground max-w-xs">
          Please allow microphone access in your browser settings to record.
        </p>
      </div>
    );
  }

  // Permission not granted yet
  if (!hasPermission) {
    return (
      <Button
        onClick={onRequestPermission}
        variant="outline"
        disabled={disabled}
        className={cn(
          'w-full gap-2',
          'backdrop-blur-xl',
          'bg-white/20 dark:bg-white/10',
          'border-white/30 dark:border-white/20',
          'hover:bg-white/30 dark:hover:bg-white/20'
        )}
      >
        <Mic className="w-4 h-4" />
        <span>Allow Microphone Access</span>
      </Button>
    );
  }

  // No devices found
  if (devices.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-center gap-2 text-amber-500">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm font-medium">No Microphones Found</span>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin motion-reduce:animate-none')} />
          <span>Refresh</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-sm">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between gap-3 px-4 py-3',
          'rounded-xl',
          'backdrop-blur-xl',
          'bg-white/20 dark:bg-white/10',
          'border border-white/30 dark:border-white/20',
          'transition-all duration-200',
          'hover:bg-white/30 dark:hover:bg-white/20',
          'focus:outline-none focus:ring-2 focus:ring-primary/50',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isOpen && 'ring-2 ring-primary/50'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Mic className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium truncate max-w-[180px]">
              {selectedDevice?.label || 'Select Microphone'}
            </p>
            <p className="text-xs text-muted-foreground">
              {devices.length} device{devices.length !== 1 ? 's' : ''} available
            </p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 w-full mt-2',
              'rounded-xl overflow-hidden',
              'backdrop-blur-xl',
              'bg-card/90',
              'border border-border/50',
              'shadow-xl'
            )}
          >
            {/* Device List */}
            <div className="max-h-64 overflow-y-auto py-1">
              {devices.map((device) => (
                <button
                  key={device.deviceId}
                  onClick={() => {
                    onSelectDevice(device.deviceId);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3',
                    'transition-colors duration-150',
                    'hover:bg-primary/10',
                    device.deviceId === selectedDeviceId && 'bg-primary/5'
                  )}
                >
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center',
                      device.deviceId === selectedDeviceId
                        ? 'bg-primary/20'
                        : 'bg-muted'
                    )}
                  >
                    <Mic
                      className={cn(
                        'w-4 h-4',
                        device.deviceId === selectedDeviceId
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      )}
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium truncate">{device.label}</p>
                    {device.isDefault && (
                      <p className="text-xs text-muted-foreground">System Default</p>
                    )}
                  </div>
                  {device.deviceId === selectedDeviceId && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <div className="border-t border-border p-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={cn(
                  'w-full flex items-center justify-center gap-2 py-2 px-3',
                  'rounded-lg text-sm',
                  'text-muted-foreground',
                  'hover:bg-muted transition-colors',
                  'disabled:opacity-50'
                )}
              >
                <RefreshCw className={cn('w-4 h-4', isRefreshing && 'animate-spin motion-reduce:animate-none')} />
                <span>Refresh devices</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

export default DeviceSelector;
