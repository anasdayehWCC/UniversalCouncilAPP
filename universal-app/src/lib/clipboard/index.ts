/**
 * Clipboard utilities
 * @module lib/clipboard
 */

// Types
export type {
  ClipboardContentType,
  ClipboardStatus,
  ClipboardResult,
  ClipboardError,
  ClipboardErrorCode,
  CopyOptions,
  PasteOptions,
  ClipboardItem,
  RichClipboardContent,
  UseClipboardState,
  UseClipboardActions,
  UseClipboardReturn,
  CopyButtonProps,
  CopyTooltipProps,
} from './types';

// Copy utilities
export {
  isClipboardSupported,
  isClipboardItemSupported,
  copyText,
  copyHtml,
  copyImage,
  copyRichContent,
  copy,
} from './copy';

// Paste utilities
export {
  isPasteSupported,
  isClipboardReadSupported,
  pasteText,
  pasteHtml,
  pasteImage,
  paste,
  handlePasteEvent,
  getImageFromPasteEvent,
  sanitizeHtml,
  htmlToText,
} from './paste';
