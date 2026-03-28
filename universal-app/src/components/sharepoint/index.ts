/**
 * SharePoint Components
 * 
 * UI components for SharePoint/OneDrive integration.
 * 
 * @module components/sharepoint
 * 
 * @example
 * ```tsx
 * import {
 *   SharePointPicker,
 *   SharePointBrowser,
 *   SharePointUploadButton,
 *   SharePointLink,
 * } from '@/components/sharepoint';
 * 
 * // Location picker modal
 * <SharePointPicker
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSelect={(location) => console.log(location)}
 * />
 * 
 * // File browser
 * <SharePointBrowser
 *   onFileSelect={(file) => console.log(file)}
 *   showUpload
 * />
 * 
 * // Quick upload button
 * <SharePointUploadButton
 *   label="Save to SharePoint"
 *   onUploadComplete={(files) => console.log(files)}
 * />
 * 
 * // Display linked document
 * <SharePointLink
 *   document={linkedDoc}
 *   onUnlink={(id) => unlink(id)}
 * />
 * ```
 */

export { SharePointPicker } from './SharePointPicker';
export { SharePointBrowser } from './SharePointBrowser';
export { SharePointUploadButton } from './SharePointUploadButton';
export { SharePointLink, SharePointLinksList } from './SharePointLink';
