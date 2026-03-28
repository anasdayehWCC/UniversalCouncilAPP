/**
 * Insights Components - Barrel Export
 * 
 * Exports all insight/analytics dashboard components for easy import.
 */

export { InsightsDashboard } from './InsightsDashboard';
export { KpiCard } from './KpiCard';
export { TeamActivityChart } from './TeamActivityChart';
export { WorkloadHeatmap } from './WorkloadHeatmap';
export { SentimentPieChart } from './SentimentPieChart';
export { TopPerformers } from './TopPerformers';
export { RecentActivityFeed } from './RecentActivityFeed';
export { InsightFilters } from './InsightFilters';

// Re-export ChartsArea for backwards compatibility
export { default as ChartsArea } from './ChartsArea';

// Re-export types
export type { KpiColor, SparklineData } from './KpiCard';
