/**
 * Domain Components - Main Export
 *
 * Components for domain switching, display, and access control.
 */

// Main components
export { DomainSwitcher, default as DomainSwitcherDefault } from './DomainSwitcher';

export {
  DomainIndicator,
  DomainBadge,
  DomainPill,
  DomainIcon,
  DomainText,
  DomainFull,
  default as DomainIndicatorDefault,
} from './DomainIndicator';

export {
  DomainGuard,
  ChildrenDomainGuard,
  AdultsDomainGuard,
  HousingDomainGuard,
  SocialCareDomainGuard,
  InlineDomainGuard,
  withDomainGuard,
  default as DomainGuardDefault,
} from './DomainGuard';
