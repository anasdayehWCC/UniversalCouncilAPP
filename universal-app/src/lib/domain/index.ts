/**
 * Domain Module - Main Export
 *
 * Service domain switching system for the Universal Council App.
 * Enables users to switch between different service areas.
 */

// Types
export type {
  ServiceDomain,
  DomainStatus,
  DomainBranding,
  DomainNavItem,
  DomainFeatures,
  DomainPermissions,
  DomainConfig,
  UserDomainAccess,
  UserDomainProfile,
  DomainState,
  DomainActions,
  DomainContextValue,
  DomainSwitchEvent,
  DomainErrorEvent,
  DomainConfigUpdate,
  DomainAwareProps,
  DomainFilterOptions,
  DomainAccessResult,
} from './types';

// Configuration
export {
  DOMAIN_CONFIGS,
  getAllDomains,
  getActiveDomains,
  getDomainConfig,
  getDomainByPath,
  isDomainAvailableForRole,
  getDomainNavigation,
  DEFAULT_DOMAIN,
  DOMAIN_STORAGE_KEY,
  DOMAIN_URL_PARAM,
  buildDomainPath,
  stripDomainPrefix,
  replaceDomainInPath,
  getDomainStatusLabel,
  getDomainStatusColor,
} from './config';
