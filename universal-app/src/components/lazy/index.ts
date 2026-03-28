/**
 * Lazy Loading Components
 * 
 * Export all lazy loading utilities and components
 */

export { LazyLoad, createLazyComponent, ViewportLazyLoad, preloadOnHover } from './LazyLoad';
export { ChunkLoadError, setupChunkErrorHandler } from './ChunkLoadError';
export type { LazyLoadProps } from './LazyLoad';
export type { ChunkLoadErrorProps } from './ChunkLoadError';

// Re-export lazy components from lib
export {
  LazyTranscriptViewer,
  LazyMinuteEditor,
  LazyInsightsDashboard,
  LazyAdminPanel,
  LazyPDFExporter,
  LazyWordExporter,
  LazyRecordingControls,
  LazyTemplateGallery,
  preloadComponent,
  preloadForRoute,
  preloadMap,
} from '@/lib/lazy';
