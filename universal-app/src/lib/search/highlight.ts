/**
 * Search Result Highlighting
 * Utilities for highlighting matched text in search results
 */

import type { SearchMatch, SearchResult } from './types';

// ============================================================================
// Types
// ============================================================================

export interface HighlightConfig {
  /** Tag to wrap highlights (e.g., 'mark', 'strong', 'span') */
  tag?: string;
  /** CSS class for highlight element */
  className?: string;
  /** Custom start wrapper */
  startTag?: string;
  /** Custom end wrapper */
  endTag?: string;
  /** Max context characters around match */
  contextLength?: number;
  /** Ellipsis for truncated context */
  ellipsis?: string;
  /** Merge overlapping highlights */
  mergeOverlapping?: boolean;
}

export interface HighlightRange {
  start: number;
  end: number;
}

export interface HighlightedSegment {
  text: string;
  isHighlight: boolean;
}

const DEFAULT_CONFIG: Required<HighlightConfig> = {
  tag: 'mark',
  className: 'search-highlight',
  startTag: '',
  endTag: '',
  contextLength: 50,
  ellipsis: '...',
  mergeOverlapping: true,
};

// ============================================================================
// Highlight Functions
// ============================================================================

/**
 * Generate start and end tags based on config
 */
function getTags(config: HighlightConfig): { start: string; end: string } {
  if (config.startTag && config.endTag) {
    return { start: config.startTag, end: config.endTag };
  }

  const tag = config.tag ?? DEFAULT_CONFIG.tag;
  const className = config.className ?? DEFAULT_CONFIG.className;
  
  return {
    start: `<${tag} class="${className}">`,
    end: `</${tag}>`,
  };
}

/**
 * Merge overlapping highlight ranges
 */
export function mergeRanges(ranges: HighlightRange[]): HighlightRange[] {
  if (ranges.length === 0) return [];

  // Sort by start position
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const merged: HighlightRange[] = [{ ...sorted[0] }];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      // Overlapping or adjacent, merge
      last.end = Math.max(last.end, current.end);
    } else {
      // No overlap, add new range
      merged.push({ ...current });
    }
  }

  return merged;
}

/**
 * Split text into highlighted and non-highlighted segments
 */
export function segmentText(
  text: string,
  ranges: HighlightRange[]
): HighlightedSegment[] {
  if (ranges.length === 0) {
    return [{ text, isHighlight: false }];
  }

  const segments: HighlightedSegment[] = [];
  const mergedRanges = mergeRanges(ranges);
  let lastEnd = 0;

  for (const range of mergedRanges) {
    // Add non-highlighted segment before match
    if (range.start > lastEnd) {
      segments.push({
        text: text.slice(lastEnd, range.start),
        isHighlight: false,
      });
    }

    // Add highlighted segment
    segments.push({
      text: text.slice(range.start, range.end),
      isHighlight: true,
    });

    lastEnd = range.end;
  }

  // Add remaining non-highlighted text
  if (lastEnd < text.length) {
    segments.push({
      text: text.slice(lastEnd),
      isHighlight: false,
    });
  }

  return segments;
}

/**
 * Highlight text by wrapping matches in tags
 */
export function highlightText(
  text: string,
  ranges: HighlightRange[],
  config: HighlightConfig = {}
): string {
  if (ranges.length === 0) return text;

  const cfg = { ...DEFAULT_CONFIG, ...config };
  const { start, end } = getTags(cfg);
  const segments = segmentText(text, cfg.mergeOverlapping ? mergeRanges(ranges) : ranges);

  return segments
    .map(seg => seg.isHighlight ? `${start}${seg.text}${end}` : seg.text)
    .join('');
}

/**
 * Highlight text based on search query
 */
export function highlightQuery(
  text: string,
  query: string,
  config: HighlightConfig = {}
): string {
  if (!query.trim()) return text;

  const cfg = { ...DEFAULT_CONFIG, ...config };
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const ranges: HighlightRange[] = [];

  let pos = 0;
  while ((pos = lowerText.indexOf(lowerQuery, pos)) !== -1) {
    ranges.push({ start: pos, end: pos + query.length });
    pos += 1;
  }

  return highlightText(text, ranges, cfg);
}

/**
 * Highlight text based on regex pattern
 */
export function highlightRegex(
  text: string,
  pattern: RegExp,
  config: HighlightConfig = {}
): string {
  const ranges: HighlightRange[] = [];
  const globalPattern = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
  
  let match;
  while ((match = globalPattern.exec(text)) !== null) {
    ranges.push({ start: match.index, end: match.index + match[0].length });
  }

  return highlightText(text, ranges, config);
}

/**
 * Highlight search matches in a result
 */
export function highlightSearchResult<T>(
  result: SearchResult<T>,
  getText: (item: T, field: string) => string,
  config: HighlightConfig = {}
): Record<string, string> {
  const highlighted: Record<string, string> = {};

  for (const match of result.matches) {
    const text = getText(result.item, match.field);
    const ranges: HighlightRange[] = result.matches
      .filter(m => m.field === match.field)
      .map(m => ({ start: m.start, end: m.end }));

    highlighted[match.field] = highlightText(text, ranges, config);
  }

  return highlighted;
}

// ============================================================================
// Context Extraction
// ============================================================================

/**
 * Extract context around a match position
 */
export function extractContext(
  text: string,
  match: SearchMatch,
  config: HighlightConfig = {}
): string {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const { contextLength, ellipsis } = cfg;

  let start = Math.max(0, match.start - contextLength);
  let end = Math.min(text.length, match.end + contextLength);

  // Adjust to word boundaries
  if (start > 0) {
    const spaceIndex = text.lastIndexOf(' ', start);
    if (spaceIndex > start - 20) {
      start = spaceIndex + 1;
    }
  }
  if (end < text.length) {
    const spaceIndex = text.indexOf(' ', end);
    if (spaceIndex !== -1 && spaceIndex < end + 20) {
      end = spaceIndex;
    }
  }

  let context = text.slice(start, end);
  
  // Add ellipsis
  if (start > 0) {
    context = ellipsis + context;
  }
  if (end < text.length) {
    context = context + ellipsis;
  }

  // Highlight the match within context
  const matchStart = match.start - start + (start > 0 ? ellipsis.length : 0);
  const matchEnd = matchStart + (match.end - match.start);
  
  return highlightText(context, [{ start: matchStart, end: matchEnd }], cfg);
}

/**
 * Get highlighted snippets for all matches
 */
export function getHighlightedSnippets<T>(
  result: SearchResult<T>,
  getText: (item: T, field: string) => string,
  config: HighlightConfig = {}
): Array<{ field: string; snippet: string }> {
  const snippets: Array<{ field: string; snippet: string }> = [];

  for (const match of result.matches) {
    const text = getText(result.item, match.field);
    const snippet = extractContext(text, match, config);
    snippets.push({ field: match.field, snippet });
  }

  return snippets;
}

// ============================================================================
// React-Compatible Utilities
// ============================================================================

/**
 * Get segments for React rendering (no HTML strings)
 */
export function getHighlightSegments(
  text: string,
  query: string
): HighlightedSegment[] {
  if (!query.trim()) {
    return [{ text, isHighlight: false }];
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const ranges: HighlightRange[] = [];

  let pos = 0;
  while ((pos = lowerText.indexOf(lowerQuery, pos)) !== -1) {
    ranges.push({ start: pos, end: pos + query.length });
    pos += 1;
  }

  return segmentText(text, mergeRanges(ranges));
}

/**
 * Get fuzzy match segments for React rendering
 */
export function getFuzzyHighlightSegments(
  text: string,
  matchedIndices: number[]
): HighlightedSegment[] {
  if (matchedIndices.length === 0) {
    return [{ text, isHighlight: false }];
  }

  // Convert individual indices to ranges
  const ranges: HighlightRange[] = [];
  let rangeStart = matchedIndices[0];
  let rangeEnd = matchedIndices[0] + 1;

  for (let i = 1; i < matchedIndices.length; i++) {
    if (matchedIndices[i] === rangeEnd) {
      // Consecutive, extend range
      rangeEnd++;
    } else {
      // Gap, save current range and start new
      ranges.push({ start: rangeStart, end: rangeEnd });
      rangeStart = matchedIndices[i];
      rangeEnd = matchedIndices[i] + 1;
    }
  }
  ranges.push({ start: rangeStart, end: rangeEnd });

  return segmentText(text, ranges);
}

// ============================================================================
// Export utilities
// ============================================================================

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function stripHighlightTags(html: string, tag = 'mark'): string {
  const regex = new RegExp(`</?${tag}[^>]*>`, 'gi');
  return html.replace(regex, '');
}
