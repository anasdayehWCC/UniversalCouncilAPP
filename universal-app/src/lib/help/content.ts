/**
 * Centralized Help Content
 *
 * Help content organized by feature area with markdown support,
 * i18n-ready structure, and documentation links.
 *
 * @module lib/help/content
 */

// ============================================================================
// Types
// ============================================================================

/**
 * A single piece of help content
 */
export interface HelpContent {
  /** Unique identifier for this help topic */
  id: string;
  /** Short title for tooltips and headers */
  title: string;
  /** Brief description (1-2 sentences) */
  summary: string;
  /** Full help content with markdown support */
  body?: string;
  /** Keywords for search */
  keywords?: string[];
  /** Related help topic IDs */
  related?: string[];
  /** Link to external documentation */
  docsUrl?: string;
  /** Video tutorial link */
  videoUrl?: string;
  /** Feature flag that must be enabled to show this help */
  featureFlag?: string;
  /** Icon name from lucide-react */
  icon?: string;
}

/**
 * Category of help content
 */
export interface HelpCategory {
  /** Category ID */
  id: string;
  /** Display name */
  name: string;
  /** Category description */
  description: string;
  /** Icon name */
  icon: string;
  /** Topics in this category */
  topics: HelpContent[];
}

/**
 * i18n-ready content structure
 */
export interface LocalizedHelpContent {
  en: HelpContent;
  [locale: string]: Partial<HelpContent>;
}

// ============================================================================
// Content Definitions
// ============================================================================

/**
 * Recording & Capture help content
 */
export const RECORDING_HELP: HelpContent[] = [
  {
    id: 'recording-start',
    title: 'Starting a Recording',
    summary: 'Tap the record button to start capturing audio from your meeting.',
    body: `
## Starting a Recording

1. **Prepare your device**: Ensure your microphone is working and positioned to capture all speakers clearly.
2. **Enter case details**: Fill in the case reference and meeting metadata before starting.
3. **Tap Record**: The red record button will start capturing immediately.
4. **Monitor levels**: Watch the audio visualizer to ensure proper capture.

### Tips for Best Quality

- Use a quiet environment when possible
- Place device centrally between all speakers
- Avoid covering the microphone
- Test audio levels before the actual meeting
    `.trim(),
    keywords: ['record', 'capture', 'audio', 'microphone', 'start'],
    docsUrl: '/docs/recording',
    icon: 'mic',
  },
  {
    id: 'recording-pause',
    title: 'Pausing & Resuming',
    summary: 'Pause recording during breaks without losing your progress.',
    body: `
## Pausing & Resuming

Use the pause button during:
- Lunch breaks
- Off-the-record discussions
- Technical interruptions

Your recording will continue seamlessly when resumed.
    `.trim(),
    keywords: ['pause', 'resume', 'break', 'stop'],
    related: ['recording-start'],
    icon: 'pause',
  },
  {
    id: 'recording-offline',
    title: 'Offline Recording',
    summary: 'Record even without internet - data syncs when you reconnect.',
    body: `
## Offline Recording

The app fully supports offline recording:

1. **Recording works offline**: All audio capture continues normally
2. **Queue for sync**: Recordings are stored locally until connectivity returns
3. **Automatic upload**: When back online, recordings sync automatically
4. **No data loss**: Local storage ensures your recordings are preserved

### Connectivity Indicator

Look for the connectivity status in the app header:
- 🟢 Green: Online and synced
- 🟡 Yellow: Partial connectivity
- 🔴 Red: Offline mode
    `.trim(),
    keywords: ['offline', 'sync', 'connectivity', 'queue', 'upload'],
    icon: 'cloud-off',
  },
  {
    id: 'recording-quality',
    title: 'Audio Quality Settings',
    summary: 'Choose between Fast (higher quality) and Economy (smaller files) modes.',
    body: `
## Audio Quality Settings

### Fast Mode
- Higher bitrate (128kbps)
- Better transcription accuracy
- Suitable for urgent cases
- Uses more storage

### Economy Mode
- Lower bitrate (64kbps)
- Cost-effective for routine recordings
- Slightly lower transcription accuracy
- Uses less storage and bandwidth
    `.trim(),
    keywords: ['quality', 'bitrate', 'fast', 'economy', 'settings'],
    icon: 'settings',
  },
];

/**
 * Transcription help content
 */
export const TRANSCRIPTION_HELP: HelpContent[] = [
  {
    id: 'transcription-overview',
    title: 'Understanding Transcriptions',
    summary: 'AI-powered speech-to-text converts your recordings to searchable text.',
    body: `
## Understanding Transcriptions

Transcriptions are automatically generated from your recordings:

1. **AI Processing**: Advanced speech recognition converts audio to text
2. **Speaker Detection**: Identifies and labels different speakers
3. **Timestamps**: Every segment is timestamped for easy reference
4. **Editable**: Review and correct any errors before publishing
    `.trim(),
    keywords: ['transcription', 'speech', 'text', 'ai', 'convert'],
    docsUrl: '/docs/transcription',
    icon: 'file-text',
  },
  {
    id: 'transcription-editing',
    title: 'Editing Transcriptions',
    summary: 'Click any segment to edit text, fix speaker labels, or adjust timestamps.',
    body: `
## Editing Transcriptions

### Correcting Text
Click on any text segment to edit:
- Fix spelling mistakes
- Correct mishearings
- Add punctuation

### Speaker Labels
- Click speaker names to reassign
- Merge similar speakers
- Add new speaker identities

### Playback Sync
- Click any segment to play that portion
- Use keyboard shortcuts for efficient editing
    `.trim(),
    keywords: ['edit', 'correct', 'speaker', 'fix'],
    related: ['transcription-overview'],
    icon: 'edit',
  },
  {
    id: 'transcription-evidence',
    title: 'Evidence Linking',
    summary: 'Click timestamps in minutes to jump to the exact moment in the transcript.',
    body: `
## Evidence Linking

Minutes are linked to their source transcriptions:

- **Citation Markers**: Blue timestamps show evidence links
- **Click to Jump**: Select any citation to hear the original audio
- **Verification**: Confirm accuracy against the source
- **Audit Trail**: All links are preserved for compliance
    `.trim(),
    keywords: ['evidence', 'link', 'citation', 'timestamp', 'verify'],
    icon: 'link',
  },
];

/**
 * Minutes help content
 */
export const MINUTES_HELP: HelpContent[] = [
  {
    id: 'minutes-overview',
    title: 'Minutes Overview',
    summary: 'AI-generated meeting summaries structured according to your templates.',
    body: `
## Minutes Overview

Minutes are professional summaries of your meetings:

1. **Auto-Generated**: AI creates initial draft from transcription
2. **Template-Based**: Structured according to your chosen template
3. **Editable**: Full editing capabilities before publishing
4. **Evidence-Linked**: Each point can reference source audio
5. **Exportable**: Download as Word, PDF, or share directly
    `.trim(),
    keywords: ['minutes', 'summary', 'meeting', 'template'],
    docsUrl: '/docs/minutes',
    icon: 'clipboard-list',
  },
  {
    id: 'minutes-editing',
    title: 'Editing Minutes',
    summary: 'Use the rich text editor to refine AI-generated minutes.',
    body: `
## Editing Minutes

### Section-Based Editing
Each section can be edited independently:
- Purpose of Visit
- Participants Present
- Key Discussion Points
- Actions & Outcomes
- Next Steps

### Formatting Options
- Bold, italic, underline
- Bullet and numbered lists
- Headers and subheaders
- Tables (where supported)
    `.trim(),
    keywords: ['edit', 'format', 'section', 'text'],
    related: ['minutes-overview'],
    icon: 'edit-3',
  },
  {
    id: 'minutes-export',
    title: 'Exporting Minutes',
    summary: 'Download as Word document, PDF, or upload directly to SharePoint.',
    body: `
## Exporting Minutes

### Available Formats
- **Word (.docx)**: Editable document with council branding
- **PDF**: Print-ready with watermarks
- **Plain Text**: Simple format for systems integration
- **HTML**: Web-ready format

### SharePoint Integration
Upload directly to your council's SharePoint:
1. Click "Share" button
2. Select SharePoint destination
3. Choose folder location
4. Confirm upload
    `.trim(),
    keywords: ['export', 'download', 'word', 'pdf', 'sharepoint'],
    related: ['minutes-overview'],
    icon: 'download',
  },
];

/**
 * Review & Approval help content
 */
export const REVIEW_HELP: HelpContent[] = [
  {
    id: 'review-queue',
    title: 'Review Queue',
    summary: 'Managers review and approve minutes before they are published.',
    body: `
## Review Queue

The review queue shows minutes awaiting approval:

### For Managers
- View pending submissions
- Filter by team, date, or case
- Approve, reject, or request changes
- Add comments for submitters

### Status Indicators
- 🟡 Pending Review
- ✓ Approved
- ✗ Rejected
- ↻ Changes Requested
    `.trim(),
    keywords: ['review', 'approve', 'queue', 'manager'],
    docsUrl: '/docs/review',
    icon: 'check-circle',
  },
  {
    id: 'review-feedback',
    title: 'Providing Feedback',
    summary: 'Add comments when requesting changes to help submitters improve.',
    body: `
## Providing Feedback

When requesting changes:

1. **Be Specific**: Point to exact sections needing revision
2. **Explain Why**: Help the submitter understand the issue
3. **Suggest Fixes**: Offer concrete improvements
4. **Set Priority**: Mark urgent vs routine corrections
    `.trim(),
    keywords: ['feedback', 'comment', 'changes', 'reject'],
    related: ['review-queue'],
    icon: 'message-circle',
  },
];

/**
 * Template help content
 */
export const TEMPLATE_HELP: HelpContent[] = [
  {
    id: 'template-selection',
    title: 'Choosing a Template',
    summary: 'Select the template that matches your meeting type before recording.',
    body: `
## Choosing a Template

Templates structure your minutes:

- **Home Visit**: Standard social care home visit format
- **Review Meeting**: Case review with multiple parties
- **Supervision**: One-to-one supervision record
- **Conference**: Multi-agency conference format

Select the appropriate template before starting to ensure the AI generates properly structured minutes.
    `.trim(),
    keywords: ['template', 'select', 'format', 'structure'],
    docsUrl: '/docs/templates',
    icon: 'layout-template',
  },
  {
    id: 'template-custom',
    title: 'Custom Templates',
    summary: 'Admins can create custom templates for specialized meeting types.',
    body: `
## Custom Templates

Administrators can create specialized templates:

1. Define sections and order
2. Set required vs optional fields
3. Add guidance prompts for AI
4. Configure approval workflows
5. Apply to specific teams or roles

Contact your system administrator to request new templates.
    `.trim(),
    keywords: ['custom', 'create', 'admin', 'new'],
    related: ['template-selection'],
    featureFlag: 'custom_templates',
    icon: 'plus-square',
  },
];

/**
 * Insights & Analytics help content  
 */
export const INSIGHTS_HELP: HelpContent[] = [
  {
    id: 'insights-dashboard',
    title: 'Insights Dashboard',
    summary: 'View team performance metrics, trends, and activity summaries.',
    body: `
## Insights Dashboard

The dashboard shows key metrics:

### Overview
- Total recordings this period
- Average processing time
- Approval rates
- Active users

### Trends
- Weekly/monthly comparisons
- Team performance
- Quality indicators
- Cost analysis
    `.trim(),
    keywords: ['dashboard', 'analytics', 'metrics', 'performance'],
    featureFlag: 'insights',
    icon: 'bar-chart-2',
  },
];

// ============================================================================
// Aggregated Content
// ============================================================================

/**
 * All help content organized by category
 */
export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: 'recording',
    name: 'Recording',
    description: 'Capturing audio from meetings and visits',
    icon: 'mic',
    topics: RECORDING_HELP,
  },
  {
    id: 'transcription',
    name: 'Transcription',
    description: 'Speech-to-text and transcript management',
    icon: 'file-text',
    topics: TRANSCRIPTION_HELP,
  },
  {
    id: 'minutes',
    name: 'Minutes',
    description: 'AI-generated meeting summaries',
    icon: 'clipboard-list',
    topics: MINUTES_HELP,
  },
  {
    id: 'review',
    name: 'Review & Approval',
    description: 'Manager review workflow',
    icon: 'check-circle',
    topics: REVIEW_HELP,
  },
  {
    id: 'templates',
    name: 'Templates',
    description: 'Meeting minute templates',
    icon: 'layout-template',
    topics: TEMPLATE_HELP,
  },
  {
    id: 'insights',
    name: 'Insights',
    description: 'Analytics and performance metrics',
    icon: 'bar-chart-2',
    topics: INSIGHTS_HELP,
  },
];

/**
 * Flat array of all help topics
 */
export const ALL_HELP_TOPICS: HelpContent[] = HELP_CATEGORIES.flatMap(
  (category) => category.topics
);

// ============================================================================
// Lookup Functions
// ============================================================================

/**
 * Get help content by ID
 */
export function getHelpContent(id: string): HelpContent | undefined {
  return ALL_HELP_TOPICS.find((topic) => topic.id === id);
}

/**
 * Get help category by ID
 */
export function getHelpCategory(id: string): HelpCategory | undefined {
  return HELP_CATEGORIES.find((category) => category.id === id);
}

/**
 * Search help content by keywords
 */
export function searchHelpContent(query: string): HelpContent[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];

  return ALL_HELP_TOPICS.filter((topic) => {
    const searchableText = [
      topic.title,
      topic.summary,
      topic.body,
      ...(topic.keywords || []),
    ]
      .join(' ')
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  }).sort((a, b) => {
    // Prioritize matches in title
    const aInTitle = a.title.toLowerCase().includes(normalizedQuery);
    const bInTitle = b.title.toLowerCase().includes(normalizedQuery);
    if (aInTitle && !bInTitle) return -1;
    if (!aInTitle && bInTitle) return 1;
    return 0;
  });
}

/**
 * Get related help topics
 */
export function getRelatedTopics(id: string): HelpContent[] {
  const topic = getHelpContent(id);
  if (!topic?.related) return [];

  return topic.related
    .map((relatedId) => getHelpContent(relatedId))
    .filter((t): t is HelpContent => t !== undefined);
}

// ============================================================================
// i18n Helpers (ready for future localization)
// ============================================================================

type Locale = 'en' | 'cy'; // English, Welsh

const LOCALIZED_CONTENT: Record<string, Partial<Record<Locale, Partial<HelpContent>>>> = {
  'recording-start': {
    cy: {
      title: 'Dechrau Recordiad',
      summary: "Tapiwch y botwm recordio i ddechrau dal sain o'ch cyfarfod.",
    },
  },
};

/**
 * Get localized help content
 */
export function getLocalizedHelpContent(
  id: string,
  locale: Locale = 'en'
): HelpContent | undefined {
  const baseContent = getHelpContent(id);
  if (!baseContent) return undefined;

  if (locale === 'en') return baseContent;

  const localizedOverrides = LOCALIZED_CONTENT[id]?.[locale];
  if (!localizedOverrides) return baseContent;

  return { ...baseContent, ...localizedOverrides };
}
