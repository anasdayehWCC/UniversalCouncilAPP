'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useMemo, useRef } from 'react';
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
  isSessionHydrated: boolean;
  personaHistory: PersonaHistoryEntry[];
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);
const DEFAULT_FEATURE_FLAGS: FeatureFlags = { aiInsights: true, housingPilot: false, smartCapture: true };

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
  const restoredUserIdRef = useRef<string | null>(null);

  // Always start with the default user so the server and client first render match.
  // localStorage hydration happens in the useEffect below to avoid SSR mismatch.
  const initialUser =
    personasSeed[defaultUserId] ??
    PERSONAS[defaultUserId] ??
    Object.values(personasSeed)[0] ??
    Object.values(PERSONAS)[0];

  const [personas] = useState<Record<string, PersonaMetadata>>(personasSeed);

  // Default to persisted user (or Sarah) — always cross-check ROLE_MATRIX.md before changing scopes.
  const [currentUser, setCurrentUser] = useState<User>(initialUser);
  const [domain, setDomain] = useState<ServiceDomain>(initialUser.domain);
  const [role, setRole] = useState<UserRole>(initialUser.role);
  const [meetings, setMeetings] = useState<Meeting[]>(sortMeetings(initialMeetings ?? PERSONA_MEETINGS));
  const [templates] = useState<Template[]>(PERSONA_TEMPLATES);
  const [featureFlags, setFeatureFlagsState] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isSessionHydrated, setIsSessionHydrated] = useState<boolean>(false);
  const [personaHistory, setPersonaHistory] = useState<PersonaHistoryEntry[]>([]);

  // Restore persisted state from localStorage after mount.
  // MUST run client-side only to keep the first render identical to the server
  // render and avoid React hydration mismatches.
  useEffect(() => {
    const savedId = window.localStorage.getItem('currentUserId');
    const restoredUserId =
      savedId && (personasSeed[savedId] ?? PERSONAS[savedId])
        ? savedId
        : null;
    const restoredUser =
      (restoredUserId ? personasSeed[restoredUserId] ?? PERSONAS[restoredUserId] : null) ??
      initialUser;
    restoredUserIdRef.current = restoredUserId;

    setCurrentUser(restoredUser);
    setDomain(restoredUser.domain);
    setRole(restoredUser.role);

    const storedFlags = window.localStorage.getItem('demo_feature_flags');
    let nextFeatureFlags = DEFAULT_FEATURE_FLAGS;
    if (storedFlags) {
      try {
        nextFeatureFlags = JSON.parse(storedFlags) as FeatureFlags;
      } catch {
        nextFeatureFlags = DEFAULT_FEATURE_FLAGS;
      }
    }
    const hasPersistedSession =
      window.localStorage.getItem('isAuthenticated') === 'true' && Boolean(restoredUserId);
    setFeatureFlagsState(nextFeatureFlags);
    setIsAuthenticated(hasPersistedSession);
    setPersonaHistory(
      hasPersistedSession
        ? [{ id: restoredUser.id, switchedAt: new Date().toISOString() }]
        : []
    );
    setIsSessionHydrated(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setFeatureFlagsState(flags);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('demo_feature_flags', JSON.stringify(flags));
    }
  }, []);

  const router = useRouter();

  const switchUser = useCallback((userId: string) => {
    const user = personas[userId];
    if (!user) {
      console.error('[DemoContext] User not found:', userId);
      return;
    }

    setCurrentUser(user);
    setDomain(user.domain);
    setRole(user.role);
    setIsAuthenticated(true);
    setIsSessionHydrated(true);
    restoredUserIdRef.current = userId;

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('currentUserId', userId);
      window.localStorage.setItem('isAuthenticated', 'true');
    }

    setPersonaHistory(prev => [
      { id: userId, switchedAt: new Date().toISOString() },
      ...prev.slice(0, 9),
    ]);

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
    setIsSessionHydrated(true);
    setPersonaHistory([]);
    restoredUserIdRef.current = null;

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
    isSessionHydrated,
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
    isAuthenticated,
    isSessionHydrated,
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
