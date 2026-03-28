/**
 * Default Templates
 * 
 * Pre-configured templates for common social care meeting types.
 * These serve as starting points and can be customized by users.
 * 
 * @module lib/templates/default-templates
 */

import { Template, TemplateSection } from './types';

// ============================================================================
// Helper to generate section IDs
// ============================================================================

function generateSectionId(templateId: string, index: number): string {
  return `${templateId}-section-${index + 1}`;
}

// ============================================================================
// Home Visit Template
// ============================================================================

const homeVisitSections: Omit<TemplateSection, 'id'>[] = [
  {
    type: 'attendance',
    title: 'Visit Details',
    prompt: 'Document who was present during the home visit, including all family members, professionals, and any other individuals. Note arrival and departure times.',
    required: true,
    order: 1,
    icon: 'Users',
    helpText: 'List all individuals present and their roles',
  },
  {
    type: 'summary',
    title: 'Visit Summary',
    prompt: 'Provide a concise summary of the home visit including the purpose, key observations, and overall assessment of the family situation.',
    required: true,
    order: 2,
    icon: 'FileText',
    minWords: 50,
    maxWords: 200,
    helpText: 'Brief overview of the visit purpose and key points',
  },
  {
    type: 'narrative',
    title: 'Environment & Living Conditions',
    prompt: 'Describe the home environment including cleanliness, safety hazards, availability of food, heating/utilities, and general living conditions. Note any concerns or improvements since last visit.',
    required: true,
    order: 3,
    icon: 'Home',
    helpText: 'Factual description of home conditions',
  },
  {
    type: 'childView',
    title: 'Child\'s Voice',
    prompt: 'Capture the child\'s wishes, feelings, and views expressed during the visit. Include direct quotes where possible. Document how the child was engaged and their demeanor.',
    required: true,
    order: 4,
    icon: 'MessageCircle',
    helpText: 'Record what the child said and how they appeared',
    locked: true,
  },
  {
    type: 'familyView',
    title: 'Family Views',
    prompt: 'Document the views and perspectives of family members, including parents/carers. Include their understanding of concerns and engagement with support.',
    required: false,
    order: 5,
    icon: 'Home',
    helpText: 'Capture family members\' perspectives',
  },
  {
    type: 'professionalView',
    title: 'Professional Assessment',
    prompt: 'Provide your professional analysis of the visit including strengths observed, concerns identified, and assessment of risk and protective factors.',
    required: true,
    order: 6,
    icon: 'Briefcase',
    minWords: 100,
    helpText: 'Your professional analysis and observations',
  },
  {
    type: 'safeguarding',
    title: 'Safeguarding Observations',
    prompt: 'Document any safeguarding concerns observed during the visit. Include signs of neglect, abuse, or other welfare concerns. Note protective factors present.',
    required: true,
    order: 7,
    icon: 'Shield',
    helpText: 'Specific safeguarding concerns or reassurances',
    locked: true,
  },
  {
    type: 'actionItems',
    title: 'Actions Required',
    prompt: 'List specific actions arising from this visit with responsible parties and target dates. Include immediate actions and longer-term follow-up.',
    required: true,
    order: 8,
    icon: 'ListTodo',
    helpText: 'Tasks with assignees and due dates',
  },
  {
    type: 'nextSteps',
    title: 'Next Steps',
    prompt: 'Outline the plan for ongoing work including next visit date, referrals to be made, and planned interventions.',
    required: true,
    order: 9,
    icon: 'ArrowRight',
    helpText: 'Future planned activities',
  },
];

export const HOME_VISIT_TEMPLATE: Template = {
  id: 'home-visit-standard',
  name: 'Home Visit',
  description: 'Standard template for documenting home visits to families',
  longDescription: 'A comprehensive template for recording home visits, designed to capture observations about the home environment, child\'s voice, family engagement, and professional assessment. Includes mandatory safeguarding considerations.',
  category: 'home_visits',
  meetingType: 'homeVisit',
  domain: 'children',
  icon: 'Home',
  version: '1.0.0',
  isDefault: true,
  isSystem: true,
  tags: ['statutory', 'visits', 'children'],
  color: '#22c55e',
  estimatedDuration: 60,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  sections: homeVisitSections.map((s, i) => ({
    ...s,
    id: generateSectionId('home-visit-standard', i),
  })),
};

// ============================================================================
// TAF Meeting Template
// ============================================================================

const tafSections: Omit<TemplateSection, 'id'>[] = [
  {
    type: 'attendance',
    title: 'Attendance',
    prompt: 'Record all attendees including family members, lead professional, and representatives from each agency. Note apologies received.',
    required: true,
    order: 1,
    icon: 'Users',
    helpText: 'Full attendance list with roles and organizations',
  },
  {
    type: 'summary',
    title: 'Meeting Purpose',
    prompt: 'State the purpose of this TAF meeting and key objectives for the discussion.',
    required: true,
    order: 2,
    icon: 'Target',
    helpText: 'What this meeting aimed to achieve',
  },
  {
    type: 'narrative',
    title: 'Progress Review',
    prompt: 'Review progress against the TAF plan since the last meeting. Document what has worked well and any barriers encountered.',
    required: true,
    order: 3,
    icon: 'TrendingUp',
    helpText: 'What progress has been made',
  },
  {
    type: 'childView',
    title: 'Child/Young Person\'s Voice',
    prompt: 'Document what the child or young person has said about their situation, wishes, and feelings. Include how their views were gathered.',
    required: true,
    order: 4,
    icon: 'MessageCircle',
    locked: true,
  },
  {
    type: 'familyView',
    title: 'Family Views',
    prompt: 'Capture the family\'s perspective on progress, challenges, and what support they need going forward.',
    required: true,
    order: 5,
    icon: 'Home',
  },
  {
    type: 'keyPoints',
    title: 'Key Discussion Points',
    prompt: 'Document the main topics discussed during the meeting, including any concerns raised by professionals or family.',
    required: true,
    order: 6,
    icon: 'List',
  },
  {
    type: 'decisions',
    title: 'Decisions Made',
    prompt: 'Record all decisions made during the meeting, including any changes to the TAF plan.',
    required: true,
    order: 7,
    icon: 'CheckSquare',
  },
  {
    type: 'risks',
    title: 'Risk & Protective Factors',
    prompt: 'Update the assessment of risk and protective factors based on discussion. Note any escalation or de-escalation.',
    required: true,
    order: 8,
    icon: 'AlertTriangle',
  },
  {
    type: 'actionItems',
    title: 'Action Plan',
    prompt: 'List all agreed actions with responsible person, target date, and agency. Include carry-forward actions from previous meeting.',
    required: true,
    order: 9,
    icon: 'ListTodo',
  },
  {
    type: 'nextSteps',
    title: 'Next Meeting',
    prompt: 'Confirm date, time, and venue for the next TAF meeting. Note any review dates.',
    required: true,
    order: 10,
    icon: 'Calendar',
  },
];

export const TAF_MEETING_TEMPLATE: Template = {
  id: 'taf-meeting-standard',
  name: 'Team Around the Family Meeting',
  description: 'Multi-agency TAF coordination meeting template',
  longDescription: 'Structured template for Team Around the Family meetings, supporting early help coordination across agencies. Captures progress, family views, and agreed multi-agency action plans.',
  category: 'meetings',
  meetingType: 'TAF',
  domain: 'children',
  icon: 'Users',
  version: '1.0.0',
  isDefault: true,
  isSystem: true,
  tags: ['early-help', 'multi-agency', 'children'],
  color: '#8b5cf6',
  estimatedDuration: 90,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  sections: tafSections.map((s, i) => ({
    ...s,
    id: generateSectionId('taf-meeting-standard', i),
  })),
};

// ============================================================================
// Child Protection Conference Template
// ============================================================================

const cpSections: Omit<TemplateSection, 'id'>[] = [
  {
    type: 'attendance',
    title: 'Conference Attendance',
    prompt: 'Record all conference attendees including family members, independent chair, social worker, and all agency representatives. Note apologies.',
    required: true,
    order: 1,
    icon: 'Users',
    locked: true,
  },
  {
    type: 'summary',
    title: 'Conference Purpose',
    prompt: 'State whether this is an initial or review conference. Summarize the concerns that led to the conference.',
    required: true,
    order: 2,
    icon: 'FileText',
    locked: true,
  },
  {
    type: 'narrative',
    title: 'History & Background',
    prompt: 'Provide relevant history and background including previous involvement with services, significant events, and current circumstances.',
    required: true,
    order: 3,
    icon: 'Clock',
  },
  {
    type: 'risks',
    title: 'Risk Assessment',
    prompt: 'Document the assessment of risk to the child(ren) including specific harms, likelihood, and severity. Reference risk assessment frameworks used.',
    required: true,
    order: 4,
    icon: 'AlertTriangle',
    locked: true,
  },
  {
    type: 'safeguarding',
    title: 'Safeguarding Concerns',
    prompt: 'Detail the specific safeguarding concerns including categories of harm, evidence, and any patterns identified.',
    required: true,
    order: 5,
    icon: 'Shield',
    locked: true,
  },
  {
    type: 'childView',
    title: 'Child\'s Wishes & Feelings',
    prompt: 'Document the child\'s wishes and feelings as gathered by the social worker or advocate. Include how these were obtained.',
    required: true,
    order: 6,
    icon: 'MessageCircle',
    locked: true,
  },
  {
    type: 'familyView',
    title: 'Family Position',
    prompt: 'Record the family\'s response to concerns, their perspective on the situation, and their proposals for change.',
    required: true,
    order: 7,
    icon: 'Home',
  },
  {
    type: 'professionalView',
    title: 'Professional Reports',
    prompt: 'Summarize key points from professional reports including social work, health, education, and police contributions.',
    required: true,
    order: 8,
    icon: 'Briefcase',
  },
  {
    type: 'decisions',
    title: 'Conference Decision',
    prompt: 'Record the conference decision including category of registration (if applicable), voting outcome, and rationale.',
    required: true,
    order: 9,
    icon: 'CheckSquare',
    locked: true,
  },
  {
    type: 'recommendations',
    title: 'Recommendations',
    prompt: 'Document formal recommendations made by the conference to the local authority and other agencies.',
    required: true,
    order: 10,
    icon: 'ThumbsUp',
  },
  {
    type: 'actionItems',
    title: 'Child Protection Plan',
    prompt: 'Outline the child protection plan including specific actions, expected outcomes, and review timescales.',
    required: true,
    order: 11,
    icon: 'ListTodo',
    locked: true,
  },
  {
    type: 'nextSteps',
    title: 'Review Arrangements',
    prompt: 'Confirm core group and review conference dates. Note contingency plans.',
    required: true,
    order: 12,
    icon: 'Calendar',
  },
];

export const CP_CONFERENCE_TEMPLATE: Template = {
  id: 'cp-conference-standard',
  name: 'Child Protection Conference',
  description: 'Formal child protection conference template',
  longDescription: 'Comprehensive template for initial and review child protection conferences. Captures multi-agency risk assessment, family views, and child protection planning in accordance with statutory requirements.',
  category: 'conferences',
  meetingType: 'CP',
  domain: 'children',
  icon: 'Shield',
  version: '1.0.0',
  isDefault: true,
  isSystem: true,
  tags: ['statutory', 'child-protection', 'conference'],
  color: '#ef4444',
  estimatedDuration: 120,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  sections: cpSections.map((s, i) => ({
    ...s,
    id: generateSectionId('cp-conference-standard', i),
  })),
};

// ============================================================================
// LAC Review Template
// ============================================================================

const lacSections: Omit<TemplateSection, 'id'>[] = [
  {
    type: 'attendance',
    title: 'Review Attendance',
    prompt: 'List all attendees including the child/young person, IRO, social worker, carers, family members, and representatives from education and health.',
    required: true,
    order: 1,
    icon: 'Users',
    locked: true,
  },
  {
    type: 'summary',
    title: 'Review Summary',
    prompt: 'Provide an executive summary of the review including placement status, care plan progress, and key themes.',
    required: true,
    order: 2,
    icon: 'FileText',
  },
  {
    type: 'narrative',
    title: 'Placement Report',
    prompt: 'Summarize the placement situation including stability, quality of care, and any concerns about the current arrangement.',
    required: true,
    order: 3,
    icon: 'Home',
  },
  {
    type: 'childView',
    title: 'Child\'s Participation',
    prompt: 'Document how the child/young person participated in their review. Record their views on their placement, education, health, identity, and future plans.',
    required: true,
    order: 4,
    icon: 'MessageCircle',
    locked: true,
  },
  {
    type: 'narrative',
    title: 'Health & Wellbeing',
    prompt: 'Report on the child\'s physical and emotional health, access to health services, and any health concerns.',
    required: true,
    order: 5,
    icon: 'Heart',
  },
  {
    type: 'narrative',
    title: 'Education & Development',
    prompt: 'Document educational progress, attendance, any special educational needs, and PEP outcomes.',
    required: true,
    order: 6,
    icon: 'GraduationCap',
  },
  {
    type: 'familyView',
    title: 'Family Contact',
    prompt: 'Review family contact arrangements including frequency, quality, and any issues. Document family members\' views.',
    required: true,
    order: 7,
    icon: 'Users',
  },
  {
    type: 'outcomes',
    title: 'Care Plan Outcomes',
    prompt: 'Review progress against care plan objectives. Assess whether each outcome has been achieved, partially achieved, or not achieved.',
    required: true,
    order: 8,
    icon: 'Target',
    locked: true,
  },
  {
    type: 'risks',
    title: 'Risk Assessment',
    prompt: 'Update risk assessment including any new concerns, vulnerabilities (e.g., CSE, Missing), and protective factors.',
    required: true,
    order: 9,
    icon: 'AlertTriangle',
  },
  {
    type: 'decisions',
    title: 'IRO Decisions',
    prompt: 'Record formal decisions made by the Independent Reviewing Officer including care plan approval.',
    required: true,
    order: 10,
    icon: 'CheckSquare',
    locked: true,
  },
  {
    type: 'recommendations',
    title: 'Recommendations',
    prompt: 'Document recommendations to the local authority from the IRO on care planning.',
    required: true,
    order: 11,
    icon: 'ThumbsUp',
  },
  {
    type: 'actionItems',
    title: 'Actions',
    prompt: 'List agreed actions with responsible person and target date.',
    required: true,
    order: 12,
    icon: 'ListTodo',
  },
  {
    type: 'nextSteps',
    title: 'Next Review',
    prompt: 'Confirm date for next review. Note any interim review requirements.',
    required: true,
    order: 13,
    icon: 'Calendar',
  },
];

export const LAC_REVIEW_TEMPLATE: Template = {
  id: 'lac-review-standard',
  name: 'LAC Review',
  description: 'Looked After Children statutory review template',
  longDescription: 'Comprehensive template for LAC reviews conducted by Independent Reviewing Officers. Covers all statutory requirements including placement, health, education, contact, and care planning.',
  category: 'reviews',
  meetingType: 'LAC',
  domain: 'children',
  icon: 'ClipboardCheck',
  version: '1.0.0',
  isDefault: true,
  isSystem: true,
  tags: ['statutory', 'LAC', 'review'],
  color: '#3b82f6',
  estimatedDuration: 90,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  sections: lacSections.map((s, i) => ({
    ...s,
    id: generateSectionId('lac-review-standard', i),
  })),
};

// ============================================================================
// CIN Meeting Template
// ============================================================================

const cinSections: Omit<TemplateSection, 'id'>[] = [
  {
    type: 'attendance',
    title: 'Attendance',
    prompt: 'List all attendees including family members, social worker, and any other professionals present.',
    required: true,
    order: 1,
    icon: 'Users',
  },
  {
    type: 'summary',
    title: 'Meeting Purpose',
    prompt: 'State the purpose of the CIN meeting - initial planning, review, or closure.',
    required: true,
    order: 2,
    icon: 'Target',
  },
  {
    type: 'narrative',
    title: 'Current Situation',
    prompt: 'Summarize the current family situation, any changes since last meeting, and presenting concerns.',
    required: true,
    order: 3,
    icon: 'FileText',
  },
  {
    type: 'childView',
    title: 'Child\'s Voice',
    prompt: 'Document the child\'s views, wishes, and feelings. How are they experiencing their situation?',
    required: true,
    order: 4,
    icon: 'MessageCircle',
    locked: true,
  },
  {
    type: 'familyView',
    title: 'Family Views',
    prompt: 'Capture the family\'s perspective on the situation and their engagement with support services.',
    required: true,
    order: 5,
    icon: 'Home',
  },
  {
    type: 'outcomes',
    title: 'CIN Plan Progress',
    prompt: 'Review progress against the CIN plan outcomes. What has been achieved?',
    required: true,
    order: 6,
    icon: 'TrendingUp',
  },
  {
    type: 'risks',
    title: 'Needs & Risks',
    prompt: 'Update assessment of the child\'s needs and any risk factors present.',
    required: true,
    order: 7,
    icon: 'AlertTriangle',
  },
  {
    type: 'decisions',
    title: 'Decisions',
    prompt: 'Record decisions made about ongoing support and any changes to the CIN plan.',
    required: true,
    order: 8,
    icon: 'CheckSquare',
  },
  {
    type: 'actionItems',
    title: 'Actions',
    prompt: 'List agreed actions with responsible person and target dates.',
    required: true,
    order: 9,
    icon: 'ListTodo',
  },
  {
    type: 'nextSteps',
    title: 'Next Steps',
    prompt: 'Confirm next meeting date and any review arrangements.',
    required: true,
    order: 10,
    icon: 'Calendar',
  },
];

export const CIN_MEETING_TEMPLATE: Template = {
  id: 'cin-meeting-standard',
  name: 'Child in Need Meeting',
  description: 'CIN planning and review meeting template',
  longDescription: 'Template for Child in Need meetings supporting planning and review of CIN plans. Captures child\'s voice, family engagement, and coordinated support.',
  category: 'meetings',
  meetingType: 'CIN',
  domain: 'children',
  icon: 'Heart',
  version: '1.0.0',
  isDefault: true,
  isSystem: true,
  tags: ['CIN', 'planning', 'children'],
  color: '#ec4899',
  estimatedDuration: 60,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  sections: cinSections.map((s, i) => ({
    ...s,
    id: generateSectionId('cin-meeting-standard', i),
  })),
};

// ============================================================================
// Supervision Template
// ============================================================================

const supervisionSections: Omit<TemplateSection, 'id'>[] = [
  {
    type: 'attendance',
    title: 'Session Details',
    prompt: 'Record date, time, location, supervisor and supervisee details.',
    required: true,
    order: 1,
    icon: 'Calendar',
  },
  {
    type: 'summary',
    title: 'Session Overview',
    prompt: 'Summarize the key focus areas for this supervision session.',
    required: true,
    order: 2,
    icon: 'FileText',
  },
  {
    type: 'keyPoints',
    title: 'Caseload Review',
    prompt: 'Review current caseload including case updates, concerns, and cases requiring escalation.',
    required: true,
    order: 3,
    icon: 'Briefcase',
  },
  {
    type: 'narrative',
    title: 'Practice Discussion',
    prompt: 'Document discussion of practice issues, approaches, and reflections on work.',
    required: false,
    order: 4,
    icon: 'MessageSquare',
  },
  {
    type: 'narrative',
    title: 'Wellbeing & Support',
    prompt: 'Discuss workload, stress management, and wellbeing. Note any support needs.',
    required: true,
    order: 5,
    icon: 'Heart',
  },
  {
    type: 'narrative',
    title: 'Development Needs',
    prompt: 'Identify learning and development needs. Review progress on training objectives.',
    required: false,
    order: 6,
    icon: 'GraduationCap',
  },
  {
    type: 'decisions',
    title: 'Decisions & Direction',
    prompt: 'Record management decisions and directions given on cases.',
    required: true,
    order: 7,
    icon: 'CheckSquare',
  },
  {
    type: 'actionItems',
    title: 'Actions',
    prompt: 'List actions for supervisor and supervisee with target completion dates.',
    required: true,
    order: 8,
    icon: 'ListTodo',
  },
  {
    type: 'nextSteps',
    title: 'Next Supervision',
    prompt: 'Confirm date and focus areas for next supervision session.',
    required: true,
    order: 9,
    icon: 'Calendar',
  },
];

export const SUPERVISION_TEMPLATE: Template = {
  id: 'supervision-standard',
  name: 'Supervision Session',
  description: 'Staff supervision and case review template',
  longDescription: 'Template for formal supervision sessions covering caseload review, practice reflection, wellbeing, and professional development.',
  category: 'supervision',
  meetingType: 'supervision',
  domain: 'all',
  icon: 'GraduationCap',
  version: '1.0.0',
  isDefault: true,
  isSystem: true,
  tags: ['supervision', 'management'],
  color: '#06b6d4',
  estimatedDuration: 60,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  sections: supervisionSections.map((s, i) => ({
    ...s,
    id: generateSectionId('supervision-standard', i),
  })),
};

// ============================================================================
// Adults Assessment Template
// ============================================================================

const adultsAssessmentSections: Omit<TemplateSection, 'id'>[] = [
  {
    type: 'attendance',
    title: 'Assessment Details',
    prompt: 'Record who was present including the individual, family members, and professionals.',
    required: true,
    order: 1,
    icon: 'Users',
  },
  {
    type: 'summary',
    title: 'Assessment Summary',
    prompt: 'Provide an overview of the assessment including presenting needs and reason for referral.',
    required: true,
    order: 2,
    icon: 'FileText',
  },
  {
    type: 'narrative',
    title: 'Personal History',
    prompt: 'Document relevant personal and social history, including any previous support received.',
    required: true,
    order: 3,
    icon: 'Clock',
  },
  {
    type: 'narrative',
    title: 'Current Situation',
    prompt: 'Describe current living situation, daily routine, and support networks.',
    required: true,
    order: 4,
    icon: 'Home',
  },
  {
    type: 'familyView',
    title: 'Individual\'s Views',
    prompt: 'Document the individual\'s wishes, preferences, and goals. What outcomes do they want?',
    required: true,
    order: 5,
    icon: 'MessageCircle',
    locked: true,
  },
  {
    type: 'keyPoints',
    title: 'Care & Support Needs',
    prompt: 'Detail identified care and support needs across all domains (personal care, nutrition, safety, etc.).',
    required: true,
    order: 6,
    icon: 'List',
  },
  {
    type: 'risks',
    title: 'Risk Assessment',
    prompt: 'Document any risks identified including falls, self-neglect, financial abuse, etc.',
    required: true,
    order: 7,
    icon: 'AlertTriangle',
  },
  {
    type: 'professionalView',
    title: 'Professional Analysis',
    prompt: 'Provide your professional analysis of needs, strengths, and eligibility for support.',
    required: true,
    order: 8,
    icon: 'Briefcase',
  },
  {
    type: 'recommendations',
    title: 'Recommendations',
    prompt: 'Set out recommendations for care and support including services, equipment, and adaptations.',
    required: true,
    order: 9,
    icon: 'ThumbsUp',
  },
  {
    type: 'nextSteps',
    title: 'Next Steps',
    prompt: 'Outline immediate next steps including any urgent actions and care planning timeline.',
    required: true,
    order: 10,
    icon: 'ArrowRight',
  },
];

export const ADULTS_ASSESSMENT_TEMPLATE: Template = {
  id: 'adults-assessment-standard',
  name: 'Adult Care Assessment',
  description: 'Care Act compliant assessment template',
  longDescription: 'Template for conducting Care Act assessments, focusing on individual outcomes, wellbeing principles, and strengths-based approaches.',
  category: 'assessments',
  meetingType: 'assessment',
  domain: 'adults',
  icon: 'FileSearch',
  version: '1.0.0',
  isDefault: true,
  isSystem: true,
  tags: ['Care Act', 'assessment', 'adults'],
  color: '#f59e0b',
  estimatedDuration: 90,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  sections: adultsAssessmentSections.map((s, i) => ({
    ...s,
    id: generateSectionId('adults-assessment-standard', i),
  })),
};

// ============================================================================
// Housing Inspection Template
// ============================================================================

const housingInspectionSections: Omit<TemplateSection, 'id'>[] = [
  {
    type: 'attendance',
    title: 'Inspection Details',
    prompt: 'Record date, time, property address, and all persons present during inspection.',
    required: true,
    order: 1,
    icon: 'MapPin',
  },
  {
    type: 'summary',
    title: 'Inspection Summary',
    prompt: 'Provide overview of inspection findings including overall property condition assessment.',
    required: true,
    order: 2,
    icon: 'FileText',
  },
  {
    type: 'keyPoints',
    title: 'Property Condition',
    prompt: 'Document condition of each area: kitchen, bathroom, bedrooms, living areas, communal spaces.',
    required: true,
    order: 3,
    icon: 'Building',
  },
  {
    type: 'risks',
    title: 'Health & Safety Issues',
    prompt: 'List any health and safety hazards identified including damp, electrical issues, fire safety.',
    required: true,
    order: 4,
    icon: 'AlertTriangle',
    locked: true,
  },
  {
    type: 'narrative',
    title: 'Repairs Required',
    prompt: 'Detail repairs needed with priority level (urgent, standard, planned).',
    required: true,
    order: 5,
    icon: 'Wrench',
  },
  {
    type: 'familyView',
    title: 'Tenant Feedback',
    prompt: 'Record tenant\'s comments, concerns, and any requests raised during inspection.',
    required: false,
    order: 6,
    icon: 'MessageCircle',
  },
  {
    type: 'actionItems',
    title: 'Actions Required',
    prompt: 'List required actions with responsible party and target completion dates.',
    required: true,
    order: 7,
    icon: 'ListTodo',
  },
  {
    type: 'nextSteps',
    title: 'Follow-up',
    prompt: 'Note any follow-up inspection requirements or escalation needs.',
    required: true,
    order: 8,
    icon: 'Calendar',
  },
];

export const HOUSING_INSPECTION_TEMPLATE: Template = {
  id: 'housing-inspection-standard',
  name: 'Housing Inspection',
  description: 'Property inspection and condition report template',
  longDescription: 'Template for documenting property inspections, condition assessments, and required repairs. Supports housing officer inspections and tenant engagement.',
  category: 'assessments',
  meetingType: 'housingInspection',
  domain: 'housing',
  icon: 'Building',
  version: '1.0.0',
  isDefault: true,
  isSystem: true,
  tags: ['inspection', 'housing', 'property'],
  color: '#84cc16',
  estimatedDuration: 45,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  sections: housingInspectionSections.map((s, i) => ({
    ...s,
    id: generateSectionId('housing-inspection-standard', i),
  })),
};

// ============================================================================
// All Default Templates
// ============================================================================

export const DEFAULT_TEMPLATES: Template[] = [
  HOME_VISIT_TEMPLATE,
  TAF_MEETING_TEMPLATE,
  CP_CONFERENCE_TEMPLATE,
  LAC_REVIEW_TEMPLATE,
  CIN_MEETING_TEMPLATE,
  SUPERVISION_TEMPLATE,
  ADULTS_ASSESSMENT_TEMPLATE,
  HOUSING_INSPECTION_TEMPLATE,
];

/**
 * Get templates by domain
 */
export function getTemplatesByDomain(domain: string): Template[] {
  return DEFAULT_TEMPLATES.filter(t => t.domain === domain || t.domain === 'all');
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): Template[] {
  return DEFAULT_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get templates by meeting type
 */
export function getTemplatesByMeetingType(meetingType: string): Template[] {
  return DEFAULT_TEMPLATES.filter(t => t.meetingType === meetingType);
}

/**
 * Get default template for a meeting type
 */
export function getDefaultTemplate(meetingType: string): Template | undefined {
  return DEFAULT_TEMPLATES.find(t => t.meetingType === meetingType && t.isDefault);
}
