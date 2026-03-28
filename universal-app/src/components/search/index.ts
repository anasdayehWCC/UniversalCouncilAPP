/**
 * Search Components
 * Re-exports all search UI components
 */

export { SearchInput, useSearchInput, type SearchInputProps, type UseSearchInputOptions } from './SearchInput';
export {
  SearchResults,
  SearchResultItem,
  HighlightText,
  VirtualizedSearchResults,
  type SearchResultsProps,
  type SearchResultItemProps,
  type HighlightTextProps,
  type VirtualizedSearchResultsProps,
} from './SearchResults';
export {
  FilterPanel,
  FilterChip,
  FilterSelect,
  FilterTextInput,
  ActiveFiltersBar,
  type FilterPanelProps,
  type FilterChipProps,
  type FilterSelectProps,
  type FilterTextInputProps,
  type ActiveFiltersBarProps,
} from './FilterPanel';
export {
  SearchPalette,
  useSearchPalette,
  type SearchPaletteProps,
  type UseSearchPaletteReturn,
} from './SearchPalette';
