'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useMemo } from 'react';
import { ServiceDomain, UserRole, DOMAINS, DomainConfig } from '@/config/domains';
import { useRouter } from 'next/navigation';
import { Meeting, MeetingStatus, User, PersonaHistoryEntry, Template } from '@/types/demo';
import { FeatureFlags } from '@/types/flags';
import { PERSONAS, MEETINGS as PERSONA_MEETINGS, TEMPLATES as PERSONA_TEMPLATES, PersonaMetadata } from '@/config/personas';

interface DemoContextType {
  domain: ServiceDomain;
  role: UserRole;
  config: DomainConfig;
  currentUser: User;
  personas: Record<string, PersonaMetadata>;
  meetings: Meeting[];
  templates: Template[];
  addMeeting: (meeting: Meeting) => void;
  updateMeetingStatus: (
    meetingId: string,
    status: MeetingStatus,
    meta?: { action?: 'approved' | 'returned' | 'rejected'; by?: string; timestamp?: string }
  ) => void;
  featureFlags: FeatureFlags;
  setFeatureFlags: (flags: FeatureFlags) => void;
  setDomain: (domain: ServiceDomain) => void;
  setRole: (role: UserRole) => void;
  switchUser: (userId: string) => void;
  signOut: () => void;
  isSocialWorker: boolean;
  isManager: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  personaHistory: PersonaHistoryEntry[];
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

function sortMeetings(meetings: Meeting[]) {
  const getDate = (m: Meeting) => new Date(m.uploadedAt || m.submittedAt || m.date).getTime();
  return [...meetings].sort((a, b) => getDate(b) - getDate(a));
}

type DemoProviderProps = {
  children: ReactNode;
  initialPersonas?: Record<string, PersonaMetadata>;
  initialMeetings?: Meeting[];
  defaultUserId?: string;
};

export function DemoProvider({
  children,
  initialPersonas,
  initialMeetings,
  defaultUserId = 'sarah',
}: DemoProviderProps) {
  const personasSeed = initialPersonas ?? PERSONAS;

  const getInitialUserId = () => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('currentUserId') || defaultUserId;
    }
    return defaultUserId;
  };

  const initialUserId = getInitialUserId();
  const initialUser =
    personasSeed[initialUserId] ??
    PERSONAS[initialUserId] ??
    Object.values(personasSeed)[0] ??
    Object.values(PERSONAS)[0];

  // Persona map is sourced from config but hydrated via API to avoid drift.
  const [personas, setPersonas] = useState<Record<string, PersonaMetadata>>(personasSeed);

  // Default to persisted user (or Sarah) — always cross-check ROLE_MATRIX.md before changing scopes.
  const [currentUser, setCurrentUser] = useState<User>(initialUser);
  const [domain, setDomain] = useState<ServiceDomain>(initialUser.domain);
  const [role, setRole] = useState<UserRole>(initialUser.role);
  const [meetings, setMeetings] = useState<Meeting[]>(sortMeetings(initialMeetings ?? PERSONA_MEETINGS));
  const [templates, setTemplates] = useState<Template[]>(PERSONA_TEMPLATES);
  const [featureFlags, setFeatureFlagsState] = useState<FeatureFlags>(() => {
    if (typeof window !== 'undefined') {
      const storedFlags = window.localStorage.getItem('demo_feature_flags');
      if (storedFlags) {
        try {
          return JSON.parse(storedFlags) as FeatureFlags;
        } catch {
          // fall through to defaults
        }
      }
    }
    return { aiInsights: true, housingPilot: false, smartCapture: true };
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem('isAuthenticated') === 'true';
  });

  const [personaHistory, setPersonaHistory] = useState<PersonaHistoryEntry[]>([
    { id: initialUser.id, switchedAt: new Date().toISOString() },
  ]);

  useEffect(() => {
    let cancelled = false;
    const hydrateFromApi = async () => {
      try {
        const res = await fetch('/api/demos/personas', { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (cancelled) return;
        if (json?.personas) {
           setPersonas(json.personas);
        }
        if (json?.meetings) setMeetings(sortMeetings(json.meetings));
        if (json?.templates) setTemplates(json.templates);
      } catch (err) {
        console.warn('Falling back to local persona config', err);
      }
    };
    hydrateFromApi();
    return () => {
      cancelled = true;
    };
  }, []);

  const addMeeting = useCallback((meeting: Meeting) => {
    // Validate meeting domain to avoid cross-tenant demo leaks.
    const normalizedMeeting = meeting.domain === currentUser.domain
      ? meeting
      : { ...meeting, domain: currentUser.domain };
    if (meeting.domain !== currentUser.domain) {
      console.warn(`Normalizing meeting domain from ${meeting.domain} to ${currentUser.domain} for persona ${currentUser.id}`);
    }
    setMeetings(prev => sortMeetings([normalizedMeeting, ...prev]));
  }, [currentUser]);

  const updateMeetingStatus = useCallback((
    meetingId: string,
    status: MeetingStatus,
    meta?: { action?: 'approved' | 'returned' | 'rejected'; by?: string; timestamp?: string }
  ) => {
    const at = meta?.timestamp || new Date().toISOString();
    setMeetings(prev => sortMeetings(prev.map(m => m.id === meetingId ? {
      ...m,
      status,
      lastAction: meta?.action ?? (status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'returned'),
      lastActionAt: at,
      lastActionBy: meta?.by,
      submittedAt: m.submittedAt || at,
    } : m)));
  }, []);

  const setFeatureFlags = useCallback((flags: FeatureFlags) => {
    console.log('Saving feature flags:', flags);
    setFeatureFlagsState(flags);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('demo_feature_flags', JSON.stringify(flags));
    }
  }, []);

  const router = useRouter();

  const switchUser = useCallback((userId: string) => {
    console.log('[DemoContext] Switching to user:', userId);
    const user = personas[userId];
    if (!user) {
      console.error('[DemoContext] User not found:', userId);
      return;
    }

    console.log('[DemoContext] User data:', user);
    setCurrentUser(user);
    setDomain(user.domain);
    setRole(user.role);
    setIsAuthenticated(true);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('currentUserId', userId);
      window.localStorage.setItem('isAuthenticated', 'true');
    }

    setPersonaHistory(prev => [
      { id: userId, switchedAt: new Date().toISOString() },
      ...prev.slice(0, 9),
    ]);

    console.log('[DemoContext] Navigation to dashboard');
    // Use setTimeout to ensure state updates complete before navigation
    setTimeout(() => {
      router.push('/');
    }, 0);
  }, [personas, router]);

  const signOut = useCallback(() => {
    const fallbackUser =
      personas[defaultUserId] ??
      PERSONAS[defaultUserId] ??
      Object.values(personas)[0] ??
      Object.values(PERSONAS)[0];

    setCurrentUser(fallbackUser);
    setDomain(fallbackUser.domain);
    setRole(fallbackUser.role);
    setIsAuthenticated(false);

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('currentUserId');
      window.localStorage.removeItem('isAuthenticated');
    }

    setTimeout(() => {
      router.push('/login');
    }, 0);
  }, [defaultUserId, personas, router]);

  const handleSetDomain = useCallback((newDomain: ServiceDomain) => {
    setDomain(newDomain);
    // Also update current user's domain temporarily for demo purposes
    setCurrentUser(prev => ({ ...prev, domain: newDomain }));
  }, []);

  const handleSetRole = useCallback((newRole: UserRole) => {
    setRole(newRole);
    // Also update current user's role temporarily
    setCurrentUser(prev => ({ ...prev, role: newRole }));
  }, []);

  const isSocialWorker = role === 'social_worker';
  const isManager = role === 'manager';
  const isAdmin = role === 'admin';

  const contextValue = useMemo(() => ({
    domain,
    role,
    config: DOMAINS[domain],
    currentUser,
    personas,
    meetings,
    templates,
    addMeeting,
    updateMeetingStatus,
    featureFlags,
    setFeatureFlags,
    setDomain: handleSetDomain,
    setRole: handleSetRole,
    switchUser,
    signOut,
    isSocialWorker,
    isManager,
    isAdmin,
    personaHistory,
    isAuthenticated,
  }), [
    domain,
    role,
    currentUser,
    personas,
    meetings,
    templates,
    addMeeting,
	    updateMeetingStatus,
	    featureFlags,
	    setFeatureFlags,
	    handleSetDomain,
    handleSetRole,
    switchUser,
    signOut,
    isSocialWorker,
    isManager,
    isAdmin,
    personaHistory,
    isAuthenticated
  ]);

  return (
    <DemoContext.Provider
      // When expanding nav/scope, always cross-check ROLE_MATRIX.md to keep personas accurate.
      value={contextValue}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
