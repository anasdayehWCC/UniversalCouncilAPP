/**
 * Clipboard copy utilities
 * Supports text, HTML, images, and rich content
 */

import type {
  ClipboardResult,
  ClipboardError,
  ClipboardErrorCode,
  CopyOptions,
  RichClipboardContent,
} from './types';

/** Default copy options */
const DEFAULT_COPY_OPTIONS: Required<CopyOptions> = {
  type: 'text/plain',
  fallbackText: '',
  notify: false,
  timeout: 5000,
};

/** Check if Clipboard API is supported */
export function isClipboardSupported(): boolean {
  return typeof navigator !== 'undefined' && 'clipboard' in navigator;
}

/** Check if ClipboardItem is supported (for rich content) */
export function isClipboardItemSupported(): boolean {
  return typeof ClipboardItem !== 'undefined';
}

/** Create a clipboard error */
function createError(code: ClipboardErrorCode, message: string, cause?: unknown): ClipboardError {
  return { code, message, cause };
}

/** Create a successful result */
function createSuccess<T>(data?: T): ClipboardResult<T> {
  return { success: true, data, timestamp: Date.now() };
}

/** Create a failed result */
function createFailure(error: ClipboardError): ClipboardResult {
  return { success: false, error, timestamp: Date.now() };
}

/**
 * Copy plain text to clipboard
 */
export async function copyText(text: string, options?: CopyOptions): Promise<ClipboardResult> {
  const opts = { ...DEFAULT_COPY_OPTIONS, ...options };

  if (!text && !opts.fallbackText) {
    return createFailure(createError('EMPTY_CONTENT', 'No content to copy'));
  }

  const contentToCopy = text || opts.fallbackText;

  if (!isClipboardSupported()) {
    // Fallback to execCommand for older browsers
    return copyTextFallback(contentToCopy);
  }

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Clipboard operation timed out')), opts.timeout);
    });

    await Promise.race([navigator.clipboard.writeText(contentToCopy), timeoutPromise]);

    return createSuccess(contentToCopy);
  } catch (error) {
    if (error instanceof Error && error.message.includes('timed out')) {
      return createFailure(createError('TIMEOUT', 'Copy operation timed out', error));
    }

    // Try fallback on permission denied
    return copyTextFallback(contentToCopy);
  }
}

/**
 * Fallback copy using execCommand (for older browsers or permission issues)
 */
function copyTextFallback(text: string): ClipboardResult {
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
    textarea.setAttribute('readonly', '');
    textarea.setAttribute('aria-hidden', 'true');
    document.body.appendChild(textarea);

    textarea.select();
    textarea.setSelectionRange(0, text.length);

    const success = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (success) {
      return createSuccess(text);
    }

    return createFailure(createError('WRITE_FAILED', 'execCommand copy failed'));
  } catch (error) {
    return createFailure(createError('WRITE_FAILED', 'Fallback copy failed', error));
  }
}

/**
 * Copy HTML content to clipboard (with plain text fallback)
 */
export async function copyHtml(
  html: string,
  plainText?: string,
  options?: CopyOptions
): Promise<ClipboardResult> {
  const text = plainText || stripHtml(html);

  if (!isClipboardItemSupported()) {
    // Fallback to plain text if ClipboardItem not supported
    return copyText(text, options);
  }

  try {
    const clipboardItems = new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([text], { type: 'text/plain' }),
    });

    await navigator.clipboard.write([clipboardItems]);
    return createSuccess(html);
  } catch (error) {
    // Fallback to plain text
    console.warn('HTML copy failed, falling back to plain text:', error);
    return copyText(text, options);
  }
}

/**
 * Copy image to clipboard
 */
export async function copyImage(
  image: Blob | HTMLCanvasElement | HTMLImageElement
): Promise<ClipboardResult> {
  if (!isClipboardItemSupported()) {
    return createFailure(createError('NOT_SUPPORTED', 'Image copy not supported in this browser'));
  }

  try {
    let blob: Blob;

    if (image instanceof Blob) {
      blob = image;
    } else if (image instanceof HTMLCanvasElement) {
      blob = await canvasToBlob(image);
    } else if (image instanceof HTMLImageElement) {
      blob = await imageElementToBlob(image);
    } else {
      return createFailure(createError('INVALID_TYPE', 'Invalid image type'));
    }

    // Ensure it's PNG (most widely supported for clipboard)
    if (blob.type !== 'image/png') {
      blob = await convertToPng(blob);
    }

    const clipboardItem = new ClipboardItem({
      [blob.type]: blob,
    });

    await navigator.clipboard.write([clipboardItem]);
    return createSuccess('Image copied');
  } catch (error) {
    return createFailure(createError('WRITE_FAILED', 'Failed to copy image', error));
  }
}

/**
 * Copy rich content (multiple formats at once)
 */
export async function copyRichContent(
  content: RichClipboardContent,
  options?: CopyOptions
): Promise<ClipboardResult> {
  if (!content.text && !content.html && !content.image) {
    return createFailure(createError('EMPTY_CONTENT', 'No content to copy'));
  }

  // If we have an image and ClipboardItem is supported
  if (content.image && isClipboardItemSupported()) {
    try {
      const items: Record<string, Blob> = {};

      if (content.text) {
        items['text/plain'] = new Blob([content.text], { type: 'text/plain' });
      }

      if (content.html) {
        items['text/html'] = new Blob([content.html], { type: 'text/html' });
      }

      // Ensure image is PNG
      let imageBlob = content.image;
      if (imageBlob.type !== 'image/png') {
        imageBlob = await convertToPng(imageBlob);
      }
      items[imageBlob.type] = imageBlob;

      await navigator.clipboard.write([new ClipboardItem(items)]);
      return createSuccess(content.text || 'Rich content copied');
    } catch (error) {
      console.warn('Rich content copy failed, trying fallback:', error);
    }
  }

  // Fallback: try HTML, then text
  if (content.html) {
    return copyHtml(content.html, content.text, options);
  }

  return copyText(content.text, options);
}

/**
 * Universal copy function - handles all content types
 */
export async function copy(
  content: string | RichClipboardContent,
  options?: CopyOptions
): Promise<ClipboardResult> {
  if (typeof content === 'string') {
    return copyText(content, options);
  }

  return copyRichContent(content, options);
}

// Helper functions

/** Strip HTML tags for plain text fallback */
function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

/** Convert canvas to blob */
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to convert canvas to blob'));
      },
      'image/png',
      1.0
    );
  });
}

/** Convert image element to blob */
async function imageElementToBlob(img: HTMLImageElement): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  ctx.drawImage(img, 0, 0);
  return canvasToBlob(canvas);
}

/** Convert any image blob to PNG */
async function convertToPng(blob: Blob): Promise<Blob> {
  const img = document.createElement('img');
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    img.onload = async () => {
      URL.revokeObjectURL(url);
      try {
        const pngBlob = await imageElementToBlob(img);
        resolve(pngBlob);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for conversion'));
    };
    img.src = url;
  });
}
