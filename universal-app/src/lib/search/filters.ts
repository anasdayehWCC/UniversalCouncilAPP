/**
 * Filter Utilities
 * Filter builders, combinators, and evaluation
 */

import type {
  FilterCondition,
  FilterConfig,
  FilterGroup,
  FilterOperator,
  PaginatedResults,
  PaginationConfig,
  SortConfig,
  SortDirection,
} from './types';

// ============================================================================
// Filter Builders
// ============================================================================

/**
 * Create a simple equality filter
 */
export function eq<T>(field: keyof T | string, value: unknown): FilterCondition<T> {
  return { field, operator: 'eq', value };
}

/**
 * Create a not-equals filter
 */
export function neq<T>(field: keyof T | string, value: unknown): FilterCondition<T> {
  return { field, operator: 'neq', value };
}

/**
 * Create a greater-than filter
 */
export function gt<T>(field: keyof T | string, value: number | Date): FilterCondition<T> {
  return { field, operator: 'gt', value };
}

/**
 * Create a greater-than-or-equal filter
 */
export function gte<T>(field: keyof T | string, value: number | Date): FilterCondition<T> {
  return { field, operator: 'gte', value };
}

/**
 * Create a less-than filter
 */
export function lt<T>(field: keyof T | string, value: number | Date): FilterCondition<T> {
  return { field, operator: 'lt', value };
}

/**
 * Create a less-than-or-equal filter
 */
export function lte<T>(field: keyof T | string, value: number | Date): FilterCondition<T> {
  return { field, operator: 'lte', value };
}

/**
 * Create an "in array" filter
 */
export function inArray<T>(field: keyof T | string, values: unknown[]): FilterCondition<T> {
  return { field, operator: 'in', value: values };
}

/**
 * Create a "not in array" filter
 */
export function notInArray<T>(field: keyof T | string, values: unknown[]): FilterCondition<T> {
  return { field, operator: 'nin', value: values };
}

/**
 * Create a "contains" filter for strings
 */
export function contains<T>(
  field: keyof T | string,
  value: string,
  caseInsensitive = true
): FilterCondition<T> {
  return { field, operator: 'contains', value, caseInsensitive };
}

/**
 * Create a "starts with" filter
 */
export function startsWith<T>(
  field: keyof T | string,
  value: string,
  caseInsensitive = true
): FilterCondition<T> {
  return { field, operator: 'startsWith', value, caseInsensitive };
}

/**
 * Create an "ends with" filter
 */
export function endsWith<T>(
  field: keyof T | string,
  value: string,
  caseInsensitive = true
): FilterCondition<T> {
  return { field, operator: 'endsWith', value, caseInsensitive };
}

/**
 * Create a "between" filter for ranges
 */
export function between<T>(
  field: keyof T | string,
  min: number | Date,
  max: number | Date
): FilterCondition<T> {
  return { field, operator: 'between', value: [min, max] };
}

/**
 * Create an "exists" filter
 */
export function exists<T>(field: keyof T | string, shouldExist = true): FilterCondition<T> {
  return { field, operator: 'exists', value: shouldExist };
}

/**
 * Create a regex filter
 */
export function regex<T>(
  field: keyof T | string,
  pattern: string | RegExp,
  caseInsensitive = false
): FilterCondition<T> {
  const value = pattern instanceof RegExp ? pattern.source : pattern;
  return { field, operator: 'regex', value, caseInsensitive };
}

// ============================================================================
// Filter Combinators
// ============================================================================

/**
 * Combine filters with AND logic
 */
export function and<T>(
  ...conditions: Array<FilterCondition<T> | FilterGroup<T>>
): FilterGroup<T> {
  return { type: 'and', conditions };
}

/**
 * Combine filters with OR logic
 */
export function or<T>(
  ...conditions: Array<FilterCondition<T> | FilterGroup<T>>
): FilterGroup<T> {
  return { type: 'or', conditions };
}

/**
 * Negate a filter (wraps in OR with opposite condition)
 */
export function not<T>(condition: FilterCondition<T>): FilterCondition<T> {
  const oppositeOperators: Record<FilterOperator, FilterOperator> = {
    eq: 'neq',
    neq: 'eq',
    gt: 'lte',
    gte: 'lt',
    lt: 'gte',
    lte: 'gt',
    in: 'nin',
    nin: 'in',
    contains: 'contains', // Will be handled specially
    startsWith: 'startsWith',
    endsWith: 'endsWith',
    between: 'between',
    exists: 'exists',
    regex: 'regex',
  };

  return {
    ...condition,
    operator: oppositeOperators[condition.operator],
    value: condition.operator === 'exists' ? !condition.value : condition.value,
  };
}

// ============================================================================
// Filter Evaluation
// ============================================================================

/**
 * Get nested field value from an object
 */
function getFieldValue(obj: unknown, field: string): unknown {
  const parts = field.split('.');
  let value: unknown = obj;
  
  for (const part of parts) {
    if (value === null || value === undefined) return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  
  return value;
}

/**
 * Compare two values based on operator
 */
function compareValues(
  fieldValue: unknown,
  operator: FilterOperator,
  filterValue: unknown,
  caseInsensitive?: boolean
): boolean {
  // Normalize strings if case-insensitive
  const normalize = (v: unknown): unknown => {
    if (caseInsensitive && typeof v === 'string') {
      return v.toLowerCase();
    }
    return v;
  };

  const normalizedField = normalize(fieldValue);
  const normalizedFilter = normalize(filterValue);

  switch (operator) {
    case 'eq':
      return normalizedField === normalizedFilter;
    
    case 'neq':
      return normalizedField !== normalizedFilter;
    
    case 'gt':
      if (fieldValue instanceof Date && filterValue instanceof Date) {
        return fieldValue.getTime() > filterValue.getTime();
      }
      return (fieldValue as number) > (filterValue as number);
    
    case 'gte':
      if (fieldValue instanceof Date && filterValue instanceof Date) {
        return fieldValue.getTime() >= filterValue.getTime();
      }
      return (fieldValue as number) >= (filterValue as number);
    
    case 'lt':
      if (fieldValue instanceof Date && filterValue instanceof Date) {
        return fieldValue.getTime() < filterValue.getTime();
      }
      return (fieldValue as number) < (filterValue as number);
    
    case 'lte':
      if (fieldValue instanceof Date && filterValue instanceof Date) {
        return fieldValue.getTime() <= filterValue.getTime();
      }
      return (fieldValue as number) <= (filterValue as number);
    
    case 'in':
      return Array.isArray(normalizedFilter) && 
        normalizedFilter.some(v => normalize(v) === normalizedField);
    
    case 'nin':
      return !Array.isArray(normalizedFilter) || 
        !normalizedFilter.some(v => normalize(v) === normalizedField);
    
    case 'contains':
      return typeof normalizedField === 'string' && 
        typeof normalizedFilter === 'string' &&
        normalizedField.includes(normalizedFilter);
    
    case 'startsWith':
      return typeof normalizedField === 'string' && 
        typeof normalizedFilter === 'string' &&
        normalizedField.startsWith(normalizedFilter);
    
    case 'endsWith':
      return typeof normalizedField === 'string' && 
        typeof normalizedFilter === 'string' &&
        normalizedField.endsWith(normalizedFilter);
    
    case 'between': {
      const [min, max] = filterValue as [number | Date, number | Date];
      if (fieldValue instanceof Date) {
        const time = fieldValue.getTime();
        const minTime = (min instanceof Date ? min : new Date(min)).getTime();
        const maxTime = (max instanceof Date ? max : new Date(max)).getTime();
        return time >= minTime && time <= maxTime;
      }
      return (fieldValue as number) >= (min as number) && 
             (fieldValue as number) <= (max as number);
    }
    
    case 'exists':
      return filterValue ? fieldValue !== undefined && fieldValue !== null :
                          fieldValue === undefined || fieldValue === null;
    
    case 'regex': {
      const flags = caseInsensitive ? 'i' : '';
      const pattern = new RegExp(filterValue as string, flags);
      return typeof fieldValue === 'string' && pattern.test(fieldValue);
    }
    
    default:
      return false;
  }
}

/**
 * Evaluate a single filter condition
 */
export function evaluateCondition<T>(item: T, condition: FilterCondition<T>): boolean {
  const fieldValue = getFieldValue(item, condition.field as string);
  return compareValues(
    fieldValue,
    condition.operator,
    condition.value,
    condition.caseInsensitive
  );
}

/**
 * Check if a condition is a filter group
 */
function isFilterGroup<T>(
  condition: FilterCondition<T> | FilterGroup<T>
): condition is FilterGroup<T> {
  return 'type' in condition && ('conditions' in condition);
}

/**
 * Evaluate a filter group
 */
export function evaluateGroup<T>(item: T, group: FilterGroup<T>): boolean {
  if (group.conditions.length === 0) return true;

  if (group.type === 'and') {
    return group.conditions.every(condition => 
      isFilterGroup(condition) 
        ? evaluateGroup(item, condition)
        : evaluateCondition(item, condition)
    );
  } else {
    return group.conditions.some(condition => 
      isFilterGroup(condition) 
        ? evaluateGroup(item, condition)
        : evaluateCondition(item, condition)
    );
  }
}

// ============================================================================
// Sorting
// ============================================================================

/**
 * Create a sort configuration
 */
export function sortBy<T>(
  field: keyof T | string,
  direction: SortDirection = 'asc',
  nullsFirst = false
): SortConfig<T> {
  return { field, direction, nullsFirst };
}

/**
 * Apply sorting to an array
 */
export function applySorting<T>(items: T[], sorts: SortConfig<T>[]): T[] {
  if (sorts.length === 0) return items;

  return [...items].sort((a, b) => {
    for (const sort of sorts) {
      const aValue = getFieldValue(a, sort.field as string);
      const bValue = getFieldValue(b, sort.field as string);

      // Handle nulls
      if (aValue === null || aValue === undefined) {
        if (bValue === null || bValue === undefined) continue;
        return sort.nullsFirst ? -1 : 1;
      }
      if (bValue === null || bValue === undefined) {
        return sort.nullsFirst ? 1 : -1;
      }

      // Compare values
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = (aValue as number) - (bValue as number);
      }

      if (comparison !== 0) {
        return sort.direction === 'asc' ? comparison : -comparison;
      }
    }
    return 0;
  });
}

// ============================================================================
// Pagination
// ============================================================================

/**
 * Apply pagination to an array
 */
export function applyPagination<T>(
  items: T[],
  config: PaginationConfig
): PaginatedResults<T> {
  const { page, pageSize } = config;
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  const validPage = Math.max(1, Math.min(page, totalPages || 1));
  
  const start = (validPage - 1) * pageSize;
  const end = start + pageSize;
  const paginatedItems = items.slice(start, end);

  return {
    items: paginatedItems,
    page: validPage,
    pageSize,
    total,
    totalPages,
    hasNext: validPage < totalPages,
    hasPrev: validPage > 1,
  };
}

// ============================================================================
// Combined Filter Application
// ============================================================================

/**
 * Apply full filter config to items
 */
export function applyFilters<T>(
  items: T[],
  config: FilterConfig<T>
): PaginatedResults<T> {
  // Apply filters
  let filtered = items.filter(item => evaluateGroup(item, config.filters));

  // Apply sorting
  if (config.sort && config.sort.length > 0) {
    filtered = applySorting(filtered, config.sort);
  }

  // Apply pagination
  const pagination = config.pagination ?? { page: 1, pageSize: filtered.length };
  return applyPagination(filtered, pagination);
}

/**
 * Build filter config from simple key-value pairs
 */
export function buildFiltersFromParams<T>(
  params: Record<string, unknown>
): FilterGroup<T> {
  const conditions: FilterCondition<T>[] = [];

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;

    // Handle array values as "in" filter
    if (Array.isArray(value)) {
      conditions.push(inArray<T>(key, value));
    } else {
      conditions.push(eq<T>(key, value));
    }
  }

  return and(...conditions);
}

// ============================================================================
// Filter Utilities
// ============================================================================

/**
 * Count items matching each filter option (for faceted search)
 */
export function countByField<T>(
  items: T[],
  field: keyof T | string
): Map<unknown, number> {
  const counts = new Map<unknown, number>();

  for (const item of items) {
    const value = getFieldValue(item, field as string);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return counts;
}

/**
 * Get unique values for a field
 */
export function uniqueValues<T>(items: T[], field: keyof T | string): unknown[] {
  const values = new Set<unknown>();

  for (const item of items) {
    const value = getFieldValue(item, field as string);
    if (value !== undefined && value !== null) {
      values.add(value);
    }
  }

  return Array.from(values);
}

/**
 * Get min and max values for a numeric field
 */
export function getRange<T>(
  items: T[],
  field: keyof T | string
): { min: number; max: number } | null {
  let min = Infinity;
  let max = -Infinity;
  let hasValues = false;

  for (const item of items) {
    const value = getFieldValue(item, field as string);
    if (typeof value === 'number') {
      hasValues = true;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }

  return hasValues ? { min, max } : null;
}
