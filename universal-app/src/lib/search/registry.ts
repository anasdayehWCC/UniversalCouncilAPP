/**
 * Search Registry
 * 
 * Centralized search indexing for meetings, templates, users, and actions.
 * Provides unified search across multiple entity types with categorization.
 * 
 * @module lib/search/registry
 */

import type { Meeting, Template, User } from '@/types/demo';

// ============================================================================
// Types
// ============================================================================

export type SearchCategory = 'meetings' | 'templates' | 'users' | 'actions';

export interface SearchAction {
  id: string;
  label: string;
  description?: string;
  shortcut?: string;
  icon?: string;
  category: 'navigation' | 'recording' | 'admin' | 'help';
  handler: () => void;
  keywords?: string[];
}

export interface SearchableItem {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle?: string;
  description?: string;
  icon?: string;
  url?: string;
  metadata?: Record<string, unknown>;
  keywords?: string[];
  score?: number;
}

export interface SearchRegistryConfig {
  /** Max recent searches to store */
  maxRecentSearches?: number;
  /** Storage key for recent searches */
  storageKey?: string;
  /** Enable action search */
  enableActions?: boolean;
}

export interface SearchSuggestion {
  text: string;
  category?: SearchCategory;
  count?: number;
}

// ============================================================================
// Default Actions
// ============================================================================

const DEFAULT_ACTIONS: Omit<SearchAction, 'handler'>[] = [
  {
    id: 'action-new-recording',
    label: 'Start New Recording',
    description: 'Begin a new meeting recording',
    shortcut: '⌘N',
    icon: '🎙️',
    category: 'recording',
    keywords: ['record', 'new', 'meeting', 'capture'],
  },
  {
    id: 'action-upload',
    label: 'Upload Recording',
    description: 'Upload an existing audio file',
    shortcut: '⌘U',
    icon: '📤',
    category: 'recording',
    keywords: ['upload', 'import', 'audio', 'file'],
  },
  {
    id: 'action-dashboard',
    label: 'Go to Dashboard',
    description: 'View your dashboard',
    shortcut: '⌘D',
    icon: '📊',
    category: 'navigation',
    keywords: ['home', 'dashboard', 'main'],
  },
  {
    id: 'action-meetings',
    label: 'View All Meetings',
    description: 'Browse all your meetings',
    icon: '📅',
    category: 'navigation',
    keywords: ['meetings', 'list', 'browse'],
  },
  {
    id: 'action-templates',
    label: 'Manage Templates',
    description: 'View and edit meeting templates',
    icon: '📋',
    category: 'navigation',
    keywords: ['templates', 'manage', 'edit'],
  },
  {
    id: 'action-settings',
    label: 'Open Settings',
    description: 'Configure your preferences',
    shortcut: '⌘,',
    icon: '⚙️',
    category: 'admin',
    keywords: ['settings', 'preferences', 'config'],
  },
  {
    id: 'action-shortcuts',
    label: 'Keyboard Shortcuts',
    description: 'View all keyboard shortcuts',
    shortcut: '⌘/',
    icon: '⌨️',
    category: 'help',
    keywords: ['shortcuts', 'keyboard', 'help', 'keys'],
  },
  {
    id: 'action-help',
    label: 'Help & Documentation',
    description: 'Get help and read documentation',
    shortcut: '⌘?',
    icon: '❓',
    category: 'help',
    keywords: ['help', 'docs', 'documentation', 'support'],
  },
];

// ============================================================================
// Search Registry Class
// ============================================================================

export class SearchRegistry {
  private meetings: Map<string, SearchableItem> = new Map();
  private templates: Map<string, SearchableItem> = new Map();
  private users: Map<string, SearchableItem> = new Map();
  private actions: Map<string, SearchAction> = new Map();
  private recentSearches: string[] = [];
  private config: Required<SearchRegistryConfig>;

  constructor(config: SearchRegistryConfig = {}) {
    this.config = {
      maxRecentSearches: config.maxRecentSearches ?? 10,
      storageKey: config.storageKey ?? 'universal-app-search-registry',
      enableActions: config.enableActions ?? true,
    };

    this.loadRecentSearches();
  }

  // --------------------------------------------------------------------------
  // Index Methods
  // --------------------------------------------------------------------------

  /**
   * Index a meeting for search
   */
  indexMeeting(meeting: Meeting): void {
    const item: SearchableItem = {
      id: meeting.id,
      category: 'meetings',
      title: meeting.title,
      subtitle: new Date(meeting.date).toLocaleDateString(),
      description: meeting.summary,
      icon: this.getMeetingIcon(meeting.status),
      url: `/meetings/${meeting.id}`,
      metadata: {
        status: meeting.status,
        domain: meeting.domain,
        attendees: meeting.attendees,
        tags: meeting.tags,
      },
      keywords: [
        meeting.title,
        meeting.summary,
        ...meeting.attendees,
        ...meeting.tags,
        meeting.domain,
        meeting.status,
      ],
    };

    this.meetings.set(meeting.id, item);
  }

  /**
   * Index multiple meetings
   */
  indexMeetings(meetings: Meeting[]): void {
    meetings.forEach((meeting) => this.indexMeeting(meeting));
  }

  /**
   * Index a template for search
   */
  indexTemplate(template: Template): void {
    const item: SearchableItem = {
      id: template.id,
      category: 'templates',
      title: template.name,
      subtitle: `${template.sections.length} sections`,
      description: template.description,
      icon: template.icon,
      url: `/templates/${template.id}`,
      metadata: {
        domain: template.domain,
        sections: template.sections,
      },
      keywords: [
        template.name,
        template.description,
        ...template.sections,
        template.domain,
      ],
    };

    this.templates.set(template.id, item);
  }

  /**
   * Index multiple templates
   */
  indexTemplates(templates: Template[]): void {
    templates.forEach((template) => this.indexTemplate(template));
  }

  /**
   * Index a user for search
   */
  indexUser(user: User): void {
    const item: SearchableItem = {
      id: user.id,
      category: 'users',
      title: user.name,
      subtitle: user.role,
      description: user.email,
      icon: '👤',
      url: `/users/${user.id}`,
      metadata: {
        role: user.role,
        domain: user.domain,
        team: user.team,
        email: user.email,
      },
      keywords: [
        user.name,
        user.email,
        user.role,
        user.team,
        user.domain,
      ],
    };

    this.users.set(user.id, item);
  }

  /**
   * Index multiple users
   */
  indexUsers(users: User[]): void {
    users.forEach((user) => this.indexUser(user));
  }

  /**
   * Register an action for search
   */
  registerAction(action: SearchAction): void {
    this.actions.set(action.id, action);
  }

  /**
   * Register default actions with handlers
   */
  registerDefaultActions(handlers: Partial<Record<string, () => void>>): void {
    DEFAULT_ACTIONS.forEach((action) => {
      const handler = handlers[action.id];
      if (handler) {
        this.registerAction({ ...action, handler });
      }
    });
  }

  // --------------------------------------------------------------------------
  // Search Methods
  // --------------------------------------------------------------------------

  /**
   * Search across all indexed items
   */
  search(
    query: string,
    options: {
      categories?: SearchCategory[];
      limit?: number;
      minScore?: number;
    } = {}
  ): SearchableItem[] {
    const {
      categories = ['meetings', 'templates', 'users', 'actions'],
      limit = 20,
      minScore = 0.3,
    } = options;

    if (!query.trim()) {
      return [];
    }

    const normalizedQuery = query.toLowerCase().trim();
    const results: SearchableItem[] = [];

    // Search each category
    if (categories.includes('meetings')) {
      results.push(...this.searchCategory(this.meetings, normalizedQuery, minScore));
    }
    if (categories.includes('templates')) {
      results.push(...this.searchCategory(this.templates, normalizedQuery, minScore));
    }
    if (categories.includes('users')) {
      results.push(...this.searchCategory(this.users, normalizedQuery, minScore));
    }
    if (categories.includes('actions') && this.config.enableActions) {
      results.push(...this.searchActions(normalizedQuery, minScore));
    }

    // Sort by score and limit
    return results
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, limit);
  }

  /**
   * Search within a specific category map
   */
  private searchCategory(
    items: Map<string, SearchableItem>,
    query: string,
    minScore: number
  ): SearchableItem[] {
    const results: SearchableItem[] = [];

    items.forEach((item) => {
      const score = this.calculateScore(item, query);
      if (score >= minScore) {
        results.push({ ...item, score });
      }
    });

    return results;
  }

  /**
   * Search actions
   */
  private searchActions(query: string, minScore: number): SearchableItem[] {
    const results: SearchableItem[] = [];

    this.actions.forEach((action) => {
      const searchText = [
        action.label,
        action.description,
        ...(action.keywords ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const score = this.calculateTextScore(searchText, query);
      if (score >= minScore) {
        results.push({
          id: action.id,
          category: 'actions',
          title: action.label,
          subtitle: action.shortcut,
          description: action.description,
          icon: action.icon,
          metadata: { handler: action.handler, actionCategory: action.category },
          score,
        });
      }
    });

    return results;
  }

  /**
   * Calculate match score for an item
   */
  private calculateScore(item: SearchableItem, query: string): number {
    const searchableText = [
      item.title,
      item.subtitle,
      item.description,
      ...(item.keywords ?? []),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return this.calculateTextScore(searchableText, query);
  }

  /**
   * Calculate fuzzy match score between text and query
   */
  private calculateTextScore(text: string, query: string): number {
    // Exact match
    if (text.includes(query)) {
      // Bonus for match at start
      if (text.startsWith(query)) return 1.0;
      // Bonus for word boundary match
      if (text.includes(` ${query}`)) return 0.95;
      return 0.9;
    }

    // Word-by-word matching
    const queryWords = query.split(/\s+/);
    const textWords = text.split(/\s+/);
    
    let matchedWords = 0;
    let totalScore = 0;

    for (const qWord of queryWords) {
      let bestWordScore = 0;
      for (const tWord of textWords) {
        if (tWord.includes(qWord)) {
          bestWordScore = Math.max(bestWordScore, 0.8);
        } else if (tWord.startsWith(qWord.slice(0, 2))) {
          bestWordScore = Math.max(bestWordScore, 0.5);
        }
      }
      if (bestWordScore > 0) {
        matchedWords++;
        totalScore += bestWordScore;
      }
    }

    if (matchedWords === 0) return 0;
    return (totalScore / queryWords.length) * (matchedWords / queryWords.length);
  }

  // --------------------------------------------------------------------------
  // Suggestions
  // --------------------------------------------------------------------------

  /**
   * Get search suggestions based on indexed data
   */
  getSuggestions(query: string, limit = 5): SearchSuggestion[] {
    if (!query.trim()) {
      // Return recent searches as suggestions when no query
      return this.recentSearches.slice(0, limit).map((text) => ({ text }));
    }

    const normalizedQuery = query.toLowerCase().trim();
    const suggestions: Map<string, SearchSuggestion> = new Map();

    // Collect unique titles matching the query
    const addSuggestions = (items: Map<string, SearchableItem>, category: SearchCategory) => {
      items.forEach((item) => {
        if (
          item.title.toLowerCase().includes(normalizedQuery) &&
          !suggestions.has(item.title.toLowerCase())
        ) {
          suggestions.set(item.title.toLowerCase(), {
            text: item.title,
            category,
          });
        }
      });
    };

    addSuggestions(this.meetings, 'meetings');
    addSuggestions(this.templates, 'templates');
    addSuggestions(this.users, 'users');

    return Array.from(suggestions.values()).slice(0, limit);
  }

  // --------------------------------------------------------------------------
  // Recent Searches
  // --------------------------------------------------------------------------

  /**
   * Add a search to recent history
   */
  addRecentSearch(query: string): void {
    if (!query.trim()) return;

    const normalizedQuery = query.trim();
    this.recentSearches = [
      normalizedQuery,
      ...this.recentSearches.filter((s) => s !== normalizedQuery),
    ].slice(0, this.config.maxRecentSearches);

    this.saveRecentSearches();
  }

  /**
   * Get recent searches
   */
  getRecentSearches(): string[] {
    return [...this.recentSearches];
  }

  /**
   * Clear recent searches
   */
  clearRecentSearches(): void {
    this.recentSearches = [];
    this.saveRecentSearches();
  }

  /**
   * Remove a specific recent search
   */
  removeRecentSearch(query: string): void {
    this.recentSearches = this.recentSearches.filter((s) => s !== query);
    this.saveRecentSearches();
  }

  private loadRecentSearches(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(`${this.config.storageKey}-recent`);
      if (stored) {
        this.recentSearches = JSON.parse(stored);
      }
    } catch {
      // Ignore storage errors
    }
  }

  private saveRecentSearches(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        `${this.config.storageKey}-recent`,
        JSON.stringify(this.recentSearches)
      );
    } catch {
      // Ignore storage errors
    }
  }

  // --------------------------------------------------------------------------
  // Utility Methods
  // --------------------------------------------------------------------------

  private getMeetingIcon(status: string): string {
    switch (status) {
      case 'draft':
        return '📝';
      case 'processing':
        return '⏳';
      case 'ready':
        return '✅';
      case 'approved':
        return '✓';
      case 'flagged':
        return '⚠️';
      default:
        return '📄';
    }
  }

  /**
   * Clear all indexed data
   */
  clear(): void {
    this.meetings.clear();
    this.templates.clear();
    this.users.clear();
  }

  /**
   * Get statistics about indexed data
   */
  getStats(): {
    meetings: number;
    templates: number;
    users: number;
    actions: number;
    recentSearches: number;
  } {
    return {
      meetings: this.meetings.size,
      templates: this.templates.size,
      users: this.users.size,
      actions: this.actions.size,
      recentSearches: this.recentSearches.length,
    };
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let registryInstance: SearchRegistry | null = null;

/**
 * Get the global search registry instance
 */
export function getSearchRegistry(config?: SearchRegistryConfig): SearchRegistry {
  if (!registryInstance) {
    registryInstance = new SearchRegistry(config);
  }
  return registryInstance;
}

/**
 * Reset the search registry (useful for testing)
 */
export function resetSearchRegistry(): void {
  registryInstance = null;
}
