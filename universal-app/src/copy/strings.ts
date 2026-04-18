export interface PersonaCopy {
  heroRole: string;
  heroGreeting: string;
  heroSubtext: string;
  heroCtaLabel: string;
  /** Domain-specific overrides for the hero CTA label */
  domainCtaLabels?: Record<string, string>;
}

import type { UserRole } from '@/config/domains';

const PRACTITIONER_COPY: PersonaCopy = {
  heroRole: 'Social worker',
  heroGreeting: 'Capture visits, review drafts, and keep minutes moving.',
  heroSubtext: 'Focus on Smart Capture and the notes that matter most.',
  heroCtaLabel: 'Create Smart Capture',
  domainCtaLabels: {
    children: 'Capture Visit',
    adults: 'Capture Session',
    housing: 'Capture Inspection',
  },
};

export const personaCopy: Record<UserRole, PersonaCopy> = {
  social_worker: PRACTITIONER_COPY,
  housing_officer: {
    ...PRACTITIONER_COPY,
    heroRole: 'Housing officer',
    heroGreeting: 'Capture inspections, review drafts, and keep minutes moving.',
    heroSubtext: 'Focus on Smart Capture and housing notes that matter most.',
    heroCtaLabel: 'Capture Inspection',
  },
  manager: {
    heroRole: 'Manager',
    heroGreeting: 'Triaging approvals and keeping teams accountable.',
    heroSubtext: 'The review queue and analytics are tuned for your oversight.',
    heroCtaLabel: 'Review priority approvals',
  },
  admin: {
    heroRole: 'Platform lead',
    heroGreeting: 'Steer modules, monitoring, and configuration for the councils.',
    heroSubtext: 'Toggle pilots, inspect health, and narrate the Universal Council story.',
    heroCtaLabel: 'View system health',
  },
};
