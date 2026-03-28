/**
 * Accessibility Components Index
 * 
 * WCAG AA compliant UI components for building accessible interfaces.
 */

// Skip Links
export { SkipLinks, SkipToContent } from './SkipLinks';
export type { SkipLinksProps, SkipLinkTarget } from './SkipLinks';

// Live Region
export {
  LiveRegion,
  GlobalAnnouncer,
  StatusAnnouncer,
  ErrorAnnouncer,
  useAnnouncementRegion,
} from './LiveRegion';
export type { LiveRegionProps } from './LiveRegion';

// Focus Trap
export {
  FocusTrap,
  ModalFocusTrap,
  MenuFocusTrap,
  useFocusTrap,
} from './FocusTrap';
export type { FocusTrapProps } from './FocusTrap';

// Visually Hidden
export {
  VisuallyHidden,
  SROnly,
  AccessibleLabel,
  AccessibleDescription,
  LiveAnnouncement,
  SkipLinkAnchor,
} from './VisuallyHidden';
export type { VisuallyHiddenProps } from './VisuallyHidden';

// Accessible Icon
export {
  AccessibleIcon,
  IconButton,
  IconLink,
  LoadingIcon,
  StatusIcon,
} from './AccessibleIcon';
export type {
  AccessibleIconProps,
  IconButtonProps,
  IconLinkProps,
} from './AccessibleIcon';
