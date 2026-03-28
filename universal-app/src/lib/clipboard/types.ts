/**
 * Clipboard utility types
 * Supports text, HTML, images, and rich content operations
 */

/** Supported clipboard content types */
export type ClipboardContentType = 'text/plain' | 'text/html' | 'image/png' | 'image/jpeg' | 'image/webp';

/** Clipboard operation status */
export type ClipboardStatus = 'idle' | 'copying' | 'copied' | 'pasting' | 'pasted' | 'error';

/** Result of a clipboard operation */
export interface ClipboardResult<T = string> {
  success: boolean;
  data?: T;
  error?: ClipboardError;
  timestamp: number;
}

/** Clipboard error with contextual information */
export interface ClipboardError {
  code: ClipboardErrorCode;
  message: string;
  cause?: unknown;
}

/** Error codes for clipboard operations */
export type ClipboardErrorCode =
  | 'NOT_SUPPORTED'
  | 'PERMISSION_DENIED'
  | 'EMPTY_CONTENT'
  | 'INVALID_TYPE'
  | 'SANITIZATION_FAILED'
  | 'WRITE_FAILED'
  | 'READ_FAILED'
  | 'TIMEOUT'
  | 'UNKNOWN';

/** Options for copy operations */
export interface CopyOptions {
  /** Content type to copy as */
  type?: ClipboardContentType;
  /** Fallback text if rich content fails */
  fallbackText?: string;
  /** Show browser notification on success */
  notify?: boolean;
  /** Timeout in milliseconds */
  timeout?: number;
}

/** Options for paste operations */
export interface PasteOptions {
  /** Accepted content types */
  acceptTypes?: ClipboardContentType[];
  /** Sanitize HTML content */
  sanitize?: boolean;
  /** Maximum content length */
  maxLength?: number;
  /** Timeout in milliseconds */
  timeout?: number;
}

/** Clipboard item with type information */
export interface ClipboardItem {
  type: ClipboardContentType;
  data: string | Blob;
}

/** Rich clipboard content for multi-type copy */
export interface RichClipboardContent {
  /** Plain text representation */
  text: string;
  /** HTML representation (optional) */
  html?: string;
  /** Image blob (optional) */
  image?: Blob;
}

/** Clipboard hook state */
export interface UseClipboardState {
  status: ClipboardStatus;
  copiedText: string | null;
  error: ClipboardError | null;
  isSupported: boolean;
}

/** Clipboard hook actions */
export interface UseClipboardActions {
  copy: (content: string | RichClipboardContent, options?: CopyOptions) => Promise<ClipboardResult>;
  paste: (options?: PasteOptions) => Promise<ClipboardResult<string>>;
  copyImage: (image: Blob | HTMLCanvasElement | HTMLImageElement) => Promise<ClipboardResult>;
  reset: () => void;
}

/** Full clipboard hook return type */
export type UseClipboardReturn = UseClipboardState & UseClipboardActions;

/** Props for CopyButton component */
export interface CopyButtonProps {
  /** Content to copy */
  content: string | RichClipboardContent | (() => string | RichClipboardContent);
  /** Copy options */
  options?: CopyOptions;
  /** Custom class name */
  className?: string;
  /** Button variant */
  variant?: 'default' | 'ghost' | 'outline' | 'icon';
  /** Button size */
  size?: 'sm' | 'md' | 'lg' | 'icon';
  /** Success message duration in ms */
  successDuration?: number;
  /** Custom success icon/text */
  successContent?: React.ReactNode;
  /** Custom default icon/text */
  defaultContent?: React.ReactNode;
  /** Callback on copy success */
  onCopy?: (result: ClipboardResult) => void;
  /** Callback on copy error */
  onError?: (error: ClipboardError) => void;
  /** Accessible label */
  'aria-label'?: string;
  /** Disabled state */
  disabled?: boolean;
}

/** Props for CopyTooltip component */
export interface CopyTooltipProps {
  /** Content to copy */
  content: string | RichClipboardContent | (() => string | RichClipboardContent);
  /** Copy options */
  options?: CopyOptions;
  /** Tooltip position */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Tooltip alignment */
  align?: 'start' | 'center' | 'end';
  /** Success message */
  successMessage?: string;
  /** Default tooltip message */
  defaultMessage?: string;
  /** Children to wrap */
  children: React.ReactNode;
  /** Success feedback duration in ms */
  successDuration?: number;
  /** Callback on copy */
  onCopy?: (result: ClipboardResult) => void;
  /** Disabled state */
  disabled?: boolean;
}
