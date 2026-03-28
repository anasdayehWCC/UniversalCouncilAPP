/**
 * Module Definitions Index
 * 
 * Re-exports all module definitions for easy importing.
 */

export { recordingModule } from './recording.module';
export { transcriptionModule } from './transcription.module';
export { minutesModule } from './minutes.module';
export { reviewModule } from './review.module';
export { insightsModule } from './insights.module';
export { adminModule } from './admin.module';
export { templatesModule } from './templates.module';

// Aggregate all modules for convenience
import { recordingModule } from './recording.module';
import { transcriptionModule } from './transcription.module';
import { minutesModule } from './minutes.module';
import { reviewModule } from './review.module';
import { insightsModule } from './insights.module';
import { adminModule } from './admin.module';
import { templatesModule } from './templates.module';
import type { ModuleDefinition } from '../types';

/**
 * All available module definitions
 */
export const allModuleDefinitions: ModuleDefinition[] = [
  // Core modules (cannot be disabled)
  minutesModule,
  adminModule,
  
  // Feature modules (can be enabled/disabled per tenant)
  recordingModule,
  transcriptionModule,
  templatesModule,
  reviewModule,
  insightsModule,
];

/**
 * Core module IDs (cannot be disabled)
 */
export const coreModuleIds = allModuleDefinitions
  .filter((m) => m.isCore)
  .map((m) => m.id);

/**
 * Feature module IDs (can be toggled)
 */
export const featureModuleIds = allModuleDefinitions
  .filter((m) => !m.isCore)
  .map((m) => m.id);
