/**
 * SharePoint Integration for Minutes
 * 
 * Handles auto-saving minutes to SharePoint, syncing document metadata,
 * and linking SharePoint files to minutes.
 * 
 * @module lib/sharepoint/integration
 */

import {
  SharePointFile,
  SharePointFolder,
  SharePointLocation,
  LinkedSharePointDocument,
  AutoSaveRule,
  SharePointCustomFields,
  UploadOptions,
} from './types';
import { SharePointClient } from './client';

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY_LINKED_DOCS = 'sharepoint_linked_documents';
const STORAGE_KEY_AUTO_SAVE_RULES = 'sharepoint_auto_save_rules';
const STORAGE_KEY_RECENT_LOCATIONS = 'sharepoint_recent_locations';

// ============================================================================
// Pattern Formatting
// ============================================================================

/**
 * Format a folder/file pattern with dynamic values
 */
function formatPattern(
  pattern: string,
  context: {
    caseReference?: string;
    meetingDate?: Date;
    minuteId?: string;
    title?: string;
    userName?: string;
    tenantName?: string;
  }
): string {
  const date = context.meetingDate || new Date();
  
  const replacements: Record<string, string> = {
    '{year}': date.getFullYear().toString(),
    '{month}': (date.getMonth() + 1).toString().padStart(2, '0'),
    '{day}': date.getDate().toString().padStart(2, '0'),
    '{monthName}': date.toLocaleString('en-GB', { month: 'long' }),
    '{date}': date.toISOString().split('T')[0],
    '{caseRef}': context.caseReference || 'NoCase',
    '{caseReference}': context.caseReference || 'NoCase',
    '{minuteId}': context.minuteId || 'unknown',
    '{title}': sanitizeFileName(context.title || 'Untitled'),
    '{userName}': sanitizeFileName(context.userName || 'Unknown'),
    '{tenant}': sanitizeFileName(context.tenantName || 'Default'),
    '{timestamp}': date.getTime().toString(),
  };

  let result = pattern;
  for (const [placeholder, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
  }

  return result;
}

/**
 * Sanitize string for use in file/folder names
 */
function sanitizeFileName(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 255);
}

// ============================================================================
// SharePoint Integration Class
// ============================================================================

export class SharePointIntegration {
  private client: SharePointClient;
  private userId: string;

  constructor(client: SharePointClient, userId: string) {
    this.client = client;
    this.userId = userId;
  }

  // ==========================================================================
  // Auto-Save Minutes
  // ==========================================================================

  /**
   * Auto-save generated minutes to SharePoint
   */
  async autoSaveMinutes(
    minuteContent: Blob | File,
    options: {
      minuteId: string;
      title: string;
      caseReference?: string;
      meetingDate?: Date;
      location: SharePointLocation;
      folderPattern?: string;
      filePattern?: string;
    }
  ): Promise<LinkedSharePointDocument> {
    const {
      minuteId,
      title,
      caseReference,
      meetingDate = new Date(),
      location,
      folderPattern = '{year}/{month}/{caseRef}',
      filePattern = '{title}_{date}',
    } = options;

    // Format destination folder path
    const folderPath = formatPattern(folderPattern, {
      caseReference,
      meetingDate,
      minuteId,
      title,
    });

    const fullFolderPath = location.folderPath
      ? `${location.folderPath}/${folderPath}`
      : folderPath;

    // Create folder structure if needed
    await this.client.createFolderPath(location.drive.id, fullFolderPath);

    // Format file name
    const extension = minuteContent.type === 'application/pdf' ? 'pdf' : 'docx';
    const fileName = `${formatPattern(filePattern, {
      caseReference,
      meetingDate,
      minuteId,
      title,
    })}.${extension}`;

    // Upload file
    const uploadOptions: UploadOptions = {
      destinationFolder: fullFolderPath,
      driveId: location.drive.id,
      fileName,
      conflictBehavior: 'rename',
      customFields: {
        minuteId,
        caseReference,
        meetingDate: meetingDate.toISOString(),
        documentType: 'minute',
      },
    };

    const uploadedFile = await this.client.uploadFile(minuteContent, uploadOptions);

    // Create and store linked document record
    const linkedDoc: LinkedSharePointDocument = {
      id: `link_${Date.now()}_${minuteId}`,
      file: uploadedFile,
      linkType: 'minute',
      linkedEntityId: minuteId,
      linkedAt: new Date().toISOString(),
      linkedBy: this.userId,
    };

    await this.storeLinkedDocument(linkedDoc);
    await this.updateRecentLocation(location);

    return linkedDoc;
  }

  /**
   * Auto-save recording to SharePoint
   */
  async autoSaveRecording(
    recordingBlob: Blob,
    options: {
      recordingId: string;
      minuteId?: string;
      title: string;
      caseReference?: string;
      meetingDate?: Date;
      location: SharePointLocation;
    }
  ): Promise<LinkedSharePointDocument> {
    const {
      recordingId,
      minuteId,
      title,
      caseReference,
      meetingDate = new Date(),
      location,
    } = options;

    const folderPath = formatPattern('{year}/{month}/Recordings/{caseRef}', {
      caseReference,
      meetingDate,
    });

    const fullFolderPath = location.folderPath
      ? `${location.folderPath}/${folderPath}`
      : folderPath;

    await this.client.createFolderPath(location.drive.id, fullFolderPath);

    // Determine extension from mime type
    const mimeExtensions: Record<string, string> = {
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/webm': 'webm',
      'audio/ogg': 'ogg',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
    };
    const extension = mimeExtensions[recordingBlob.type] || 'audio';

    const fileName = `${sanitizeFileName(title)}_Recording_${meetingDate.toISOString().split('T')[0]}.${extension}`;

    const uploadedFile = await this.client.uploadFile(recordingBlob, {
      destinationFolder: fullFolderPath,
      driveId: location.drive.id,
      fileName,
      conflictBehavior: 'rename',
      customFields: {
        recordingId,
        minuteId,
        caseReference,
        meetingDate: meetingDate.toISOString(),
        documentType: 'recording',
      },
    });

    const linkedDoc: LinkedSharePointDocument = {
      id: `link_${Date.now()}_${recordingId}`,
      file: uploadedFile,
      linkType: 'recording',
      linkedEntityId: recordingId,
      linkedAt: new Date().toISOString(),
      linkedBy: this.userId,
    };

    await this.storeLinkedDocument(linkedDoc);

    return linkedDoc;
  }

  // ==========================================================================
  // Link Management
  // ==========================================================================

  /**
   * Link an existing SharePoint file to a minute
   */
  async linkFileToMinute(
    file: SharePointFile,
    minuteId: string,
    linkType: 'minute' | 'recording' | 'attachment' = 'attachment'
  ): Promise<LinkedSharePointDocument> {
    const linkedDoc: LinkedSharePointDocument = {
      id: `link_${Date.now()}_${file.id}`,
      file,
      linkType,
      linkedEntityId: minuteId,
      linkedAt: new Date().toISOString(),
      linkedBy: this.userId,
    };

    await this.storeLinkedDocument(linkedDoc);

    return linkedDoc;
  }

  /**
   * Unlink a SharePoint file from a minute
   */
  async unlinkFile(linkId: string): Promise<void> {
    const docs = await this.getLinkedDocuments();
    const filtered = docs.filter(doc => doc.id !== linkId);
    localStorage.setItem(STORAGE_KEY_LINKED_DOCS, JSON.stringify(filtered));
  }

  /**
   * Get all linked documents for a minute
   */
  async getLinkedDocumentsForMinute(minuteId: string): Promise<LinkedSharePointDocument[]> {
    const docs = await this.getLinkedDocuments();
    return docs.filter(doc => doc.linkedEntityId === minuteId);
  }

  /**
   * Get all linked documents
   */
  async getLinkedDocuments(): Promise<LinkedSharePointDocument[]> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LINKED_DOCS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Store linked document
   */
  private async storeLinkedDocument(doc: LinkedSharePointDocument): Promise<void> {
    const docs = await this.getLinkedDocuments();
    docs.push(doc);
    localStorage.setItem(STORAGE_KEY_LINKED_DOCS, JSON.stringify(docs));
  }

  // ==========================================================================
  // Auto-Save Rules
  // ==========================================================================

  /**
   * Get auto-save rules
   */
  async getAutoSaveRules(): Promise<AutoSaveRule[]> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_AUTO_SAVE_RULES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save auto-save rule
   */
  async saveAutoSaveRule(rule: AutoSaveRule): Promise<void> {
    const rules = await this.getAutoSaveRules();
    const existingIndex = rules.findIndex(r => r.id === rule.id);
    
    if (existingIndex >= 0) {
      rules[existingIndex] = rule;
    } else {
      rules.push(rule);
    }
    
    localStorage.setItem(STORAGE_KEY_AUTO_SAVE_RULES, JSON.stringify(rules));
  }

  /**
   * Delete auto-save rule
   */
  async deleteAutoSaveRule(ruleId: string): Promise<void> {
    const rules = await this.getAutoSaveRules();
    const filtered = rules.filter(r => r.id !== ruleId);
    localStorage.setItem(STORAGE_KEY_AUTO_SAVE_RULES, JSON.stringify(filtered));
  }

  /**
   * Get active rule for a trigger
   */
  async getActiveRuleForTrigger(
    trigger: AutoSaveRule['trigger']
  ): Promise<AutoSaveRule | null> {
    const rules = await this.getAutoSaveRules();
    return rules.find(r => r.enabled && r.trigger === trigger) || null;
  }

  // ==========================================================================
  // Recent Locations
  // ==========================================================================

  /**
   * Get recent SharePoint locations
   */
  async getRecentLocations(): Promise<SharePointLocation[]> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_RECENT_LOCATIONS);
      const recent = stored ? JSON.parse(stored) : [];
      return recent
        .sort((a: { lastAccessedAt: string }, b: { lastAccessedAt: string }) => 
          new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime()
        )
        .slice(0, 10)
        .map((r: { location: SharePointLocation }) => r.location);
    } catch {
      return [];
    }
  }

  /**
   * Update recent location (add or bump to top)
   */
  async updateRecentLocation(location: SharePointLocation): Promise<void> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_RECENT_LOCATIONS);
      const recent: Array<{ location: SharePointLocation; lastAccessedAt: string; accessCount: number }> = 
        stored ? JSON.parse(stored) : [];
      
      const existingIndex = recent.findIndex(
        r => r.location.drive.id === location.drive.id && 
             r.location.folderId === location.folderId
      );
      
      if (existingIndex >= 0) {
        recent[existingIndex].lastAccessedAt = new Date().toISOString();
        recent[existingIndex].accessCount += 1;
      } else {
        recent.unshift({
          location,
          lastAccessedAt: new Date().toISOString(),
          accessCount: 1,
        });
      }
      
      // Keep only top 20
      const trimmed = recent.slice(0, 20);
      localStorage.setItem(STORAGE_KEY_RECENT_LOCATIONS, JSON.stringify(trimmed));
    } catch {
      // Ignore storage errors
    }
  }

  // ==========================================================================
  // Metadata Sync
  // ==========================================================================

  /**
   * Sync custom metadata to SharePoint file
   * Note: This requires custom columns set up in SharePoint
   */
  async syncMetadataToFile(
    driveId: string,
    fileId: string,
    metadata: SharePointCustomFields
  ): Promise<void> {
    // Note: Updating custom columns requires the list item ID
    // This is a placeholder - full implementation depends on SharePoint setup
    console.log('Syncing metadata to SharePoint file:', { driveId, fileId, metadata });
    
    // In a real implementation, you would:
    // 1. Get the list item associated with the file
    // 2. Update the list item's custom columns
    // 3. This requires specific SharePoint list column configuration
  }

  /**
   * Batch sync metadata for multiple files
   */
  async batchSyncMetadata(
    items: Array<{ driveId: string; fileId: string; metadata: SharePointCustomFields }>
  ): Promise<void> {
    // Process in batches of 20 (Graph API batch limit)
    const batchSize = 20;
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      await Promise.all(
        batch.map(item => this.syncMetadataToFile(item.driveId, item.fileId, item.metadata))
      );
    }
  }

  // ==========================================================================
  // Organization Helpers
  // ==========================================================================

  /**
   * Generate organized folder path for a minute
   */
  generateFolderPath(options: {
    caseReference?: string;
    meetingDate?: Date;
    organization?: string;
    department?: string;
  }): string {
    const { caseReference, meetingDate = new Date(), organization, department } = options;
    
    const parts: string[] = [];
    
    if (organization) {
      parts.push(sanitizeFileName(organization));
    }
    
    if (department) {
      parts.push(sanitizeFileName(department));
    }
    
    parts.push(meetingDate.getFullYear().toString());
    parts.push((meetingDate.getMonth() + 1).toString().padStart(2, '0'));
    
    if (caseReference) {
      parts.push(sanitizeFileName(caseReference));
    }
    
    return parts.join('/');
  }

  /**
   * Generate organized file name for a minute
   */
  generateFileName(options: {
    title: string;
    meetingDate?: Date;
    caseReference?: string;
    type: 'minute' | 'recording' | 'export';
  }): string {
    const { title, meetingDate = new Date(), caseReference, type } = options;
    
    const parts: string[] = [];
    
    if (caseReference) {
      parts.push(caseReference);
    }
    
    parts.push(sanitizeFileName(title));
    parts.push(meetingDate.toISOString().split('T')[0]);
    
    if (type === 'recording') {
      parts.push('Recording');
    } else if (type === 'export') {
      parts.push('Export');
    }
    
    return parts.join('_');
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create SharePoint integration instance
 */
export function createSharePointIntegration(
  client: SharePointClient,
  userId: string
): SharePointIntegration {
  return new SharePointIntegration(client, userId);
}
