/**
 * Clipboard paste utilities with sanitization
 * Supports text, HTML, and images with safe content handling
 */

import type {
  ClipboardResult,
  ClipboardError,
  ClipboardErrorCode,
  ClipboardContentType,
  PasteOptions,
} from './types';

/** Default paste options */
const DEFAULT_PASTE_OPTIONS: Required<PasteOptions> = {
  acceptTypes: ['text/plain', 'text/html'],
  sanitize: true,
  maxLength: 1_000_000, // 1MB text limit
  timeout: 5000,
};

/** Dangerous HTML tags to remove */
const DANGEROUS_TAGS = [
  'script',
  'iframe',
  'object',
  'embed',
  'form',
  'input',
  'button',
  'meta',
  'link',
  'style',
  'base',
];

/** Dangerous attributes to remove */
const DANGEROUS_ATTRS = [
  'onclick',
  'onload',
  'onerror',
  'onmouseover',
  'onmouseout',
  'onfocus',
  'onblur',
  'onchange',
  'onsubmit',
  'onkeydown',
  'onkeyup',
  'onkeypress',
  'javascript:',
  'data:text/html',
  'vbscript:',
];

/** Create a clipboard error */
function createError(code: ClipboardErrorCode, message: string, cause?: unknown): ClipboardError {
  return { code, message, cause };
}

/** Create a successful result */
function createSuccess<T>(data: T): ClipboardResult<T> {
  return { success: true, data, timestamp: Date.now() };
}

/** Create a failed result */
function createFailure<T>(error: ClipboardError): ClipboardResult<T> {
  return { success: false, error, timestamp: Date.now() };
}

/** Check if Clipboard API read is supported */
export function isPasteSupported(): boolean {
  return typeof navigator !== 'undefined' && 'clipboard' in navigator && 'readText' in navigator.clipboard;
}

/** Check if reading all clipboard types is supported */
export function isClipboardReadSupported(): boolean {
  return typeof navigator !== 'undefined' && 'clipboard' in navigator && 'read' in navigator.clipboard;
}

/**
 * Read plain text from clipboard
 */
export async function pasteText(options?: PasteOptions): Promise<ClipboardResult<string>> {
  const opts = { ...DEFAULT_PASTE_OPTIONS, ...options };

  if (!isPasteSupported()) {
    return createFailure(createError('NOT_SUPPORTED', 'Clipboard read not supported'));
  }

  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Clipboard read timed out')), opts.timeout);
    });

    const text = await Promise.race([navigator.clipboard.readText(), timeoutPromise]);

    if (!text) {
      return createFailure(createError('EMPTY_CONTENT', 'Clipboard is empty'));
    }

    // Apply max length limit
    const truncated = text.length > opts.maxLength ? text.slice(0, opts.maxLength) : text;

    return createSuccess(truncated);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      return createFailure(createError('PERMISSION_DENIED', 'Clipboard read permission denied', error));
    }

    if (error instanceof Error && error.message.includes('timed out')) {
      return createFailure(createError('TIMEOUT', 'Paste operation timed out', error));
    }

    return createFailure(createError('READ_FAILED', 'Failed to read clipboard', error));
  }
}

/**
 * Read HTML from clipboard (with sanitization)
 */
export async function pasteHtml(options?: PasteOptions): Promise<ClipboardResult<string>> {
  const opts = { ...DEFAULT_PASTE_OPTIONS, ...options };

  if (!isClipboardReadSupported()) {
    // Fallback to text
    return pasteText(options);
  }

  try {
    const items = await navigator.clipboard.read();

    for (const item of items) {
      // Check for HTML
      if (item.types.includes('text/html') && opts.acceptTypes.includes('text/html')) {
        const blob = await item.getType('text/html');
        let html = await blob.text();

        // Apply max length
        if (html.length > opts.maxLength) {
          html = html.slice(0, opts.maxLength);
        }

        // Sanitize if enabled
        if (opts.sanitize) {
          html = sanitizeHtml(html);
        }

        return createSuccess(html);
      }

      // Fallback to plain text
      if (item.types.includes('text/plain') && opts.acceptTypes.includes('text/plain')) {
        const blob = await item.getType('text/plain');
        let text = await blob.text();

        if (text.length > opts.maxLength) {
          text = text.slice(0, opts.maxLength);
        }

        return createSuccess(text);
      }
    }

    return createFailure(createError('EMPTY_CONTENT', 'No compatible content in clipboard'));
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      return createFailure(createError('PERMISSION_DENIED', 'Clipboard read permission denied', error));
    }

    return createFailure(createError('READ_FAILED', 'Failed to read clipboard', error));
  }
}

/**
 * Read image from clipboard
 */
export async function pasteImage(options?: PasteOptions): Promise<ClipboardResult<Blob>> {
  if (!isClipboardReadSupported()) {
    return createFailure(createError('NOT_SUPPORTED', 'Image paste not supported'));
  }

  const imageTypes: ClipboardContentType[] = ['image/png', 'image/jpeg', 'image/webp'];

  try {
    const items = await navigator.clipboard.read();

    for (const item of items) {
      for (const type of imageTypes) {
        if (item.types.includes(type)) {
          const blob = await item.getType(type);
          return createSuccess(blob);
        }
      }
    }

    return createFailure(createError('EMPTY_CONTENT', 'No image in clipboard'));
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      return createFailure(createError('PERMISSION_DENIED', 'Clipboard read permission denied', error));
    }

    return createFailure(createError('READ_FAILED', 'Failed to read image from clipboard', error));
  }
}

/**
 * Read any available content from clipboard
 */
export async function paste(options?: PasteOptions): Promise<ClipboardResult<string>> {
  const opts = { ...DEFAULT_PASTE_OPTIONS, ...options };

  // Try HTML first if accepted
  if (opts.acceptTypes.includes('text/html') && isClipboardReadSupported()) {
    const htmlResult = await pasteHtml(options);
    if (htmlResult.success) return htmlResult;
  }

  // Fallback to text
  return pasteText(options);
}

/**
 * Handle paste event from input/textarea
 */
export function handlePasteEvent(
  event: ClipboardEvent,
  options?: PasteOptions
): ClipboardResult<string> | null {
  const opts = { ...DEFAULT_PASTE_OPTIONS, ...options };
  const clipboardData = event.clipboardData;

  if (!clipboardData) {
    return null;
  }

  // Try HTML first
  if (opts.acceptTypes.includes('text/html')) {
    let html = clipboardData.getData('text/html');
    if (html) {
      if (html.length > opts.maxLength) {
        html = html.slice(0, opts.maxLength);
      }
      if (opts.sanitize) {
        html = sanitizeHtml(html);
      }
      return createSuccess(html);
    }
  }

  // Fallback to plain text
  if (opts.acceptTypes.includes('text/plain')) {
    let text = clipboardData.getData('text/plain');
    if (text) {
      if (text.length > opts.maxLength) {
        text = text.slice(0, opts.maxLength);
      }
      return createSuccess(text);
    }
  }

  return createFailure(createError('EMPTY_CONTENT', 'No compatible content in paste event'));
}

/**
 * Get image from paste event
 */
export function getImageFromPasteEvent(event: ClipboardEvent): Blob | null {
  const clipboardData = event.clipboardData;
  if (!clipboardData) return null;

  for (let i = 0; i < clipboardData.items.length; i++) {
    const item = clipboardData.items[i];
    if (item.type.startsWith('image/')) {
      return item.getAsFile();
    }
  }

  return null;
}

/**
 * Sanitize HTML content to remove dangerous elements
 */
export function sanitizeHtml(html: string): string {
  if (typeof DOMParser === 'undefined') {
    // Server-side: return stripped text
    return html.replace(/<[^>]*>/g, '');
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove dangerous tags
    for (const tag of DANGEROUS_TAGS) {
      const elements = doc.querySelectorAll(tag);
      elements.forEach((el) => el.remove());
    }

    // Remove dangerous attributes from all elements
    const allElements = doc.querySelectorAll('*');
    allElements.forEach((el) => {
      const attrs = Array.from(el.attributes);
      for (const attr of attrs) {
        const attrName = attr.name.toLowerCase();
        const attrValue = attr.value.toLowerCase();

        // Check if attribute name or value is dangerous
        const isDangerous = DANGEROUS_ATTRS.some(
          (dangerous) => attrName.includes(dangerous) || attrValue.includes(dangerous)
        );

        if (isDangerous) {
          el.removeAttribute(attr.name);
        }
      }
    });

    // Return sanitized body content
    return doc.body.innerHTML;
  } catch (error) {
    console.error('HTML sanitization failed:', error);
    // Return stripped text as fallback
    return html.replace(/<[^>]*>/g, '');
  }
}

/**
 * Convert HTML to plain text
 */
export function htmlToText(html: string): string {
  if (typeof DOMParser === 'undefined') {
    return html.replace(/<[^>]*>/g, '');
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return doc.body.textContent || doc.body.innerText || '';
}
