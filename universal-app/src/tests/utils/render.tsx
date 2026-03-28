/**
 * Custom Render Utility
 * 
 * Wraps components with all required providers for testing.
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// ============================================
// Mock Providers
// ============================================

// Mock DemoContext provider
interface DemoContextValue {
  domain: string;
  role: string;
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  isSocialWorker: boolean;
  isManager: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  featureFlags: Record<string, boolean>;
  setFeatureFlags: (flags: Record<string, boolean>) => void;
  setDomain: (domain: string) => void;
  setRole: (role: string) => void;
  meetings: Array<{ id: string; title: string; status: string }>;
  addMeeting: (meeting: { id: string; title: string; status: string }) => void;
  updateMeetingStatus: (id: string, status: string) => void;
  templates: Array<{ id: string; name: string }>;
  switchUser: (userId: string) => void;
  signOut: () => void;
}

const defaultDemoContext: DemoContextValue = {
  domain: 'children',
  role: 'social_worker',
  currentUser: {
    id: 'test-user-1',
    name: 'Test User',
    email: 'test@council.gov.uk',
    role: 'social_worker',
  },
  isSocialWorker: true,
  isManager: false,
  isAdmin: false,
  isAuthenticated: true,
  featureFlags: {
    offlineMode: true,
    liveTranscription: false,
    aiAssistant: true,
    templates: true,
    exportPdf: true,
    exportDocx: true,
  },
  setFeatureFlags: vi.fn(),
  setDomain: vi.fn(),
  setRole: vi.fn(),
  meetings: [],
  addMeeting: vi.fn(),
  updateMeetingStatus: vi.fn(),
  templates: [],
  switchUser: vi.fn(),
  signOut: vi.fn(),
};

const DemoContext = React.createContext<DemoContextValue>(defaultDemoContext);

// Mock Theme Provider
interface ThemeContextValue {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

const defaultThemeContext: ThemeContextValue = {
  theme: 'light',
  setTheme: vi.fn(),
};

const ThemeContext = React.createContext<ThemeContextValue>(defaultThemeContext);

// ============================================
// Provider Wrapper
// ============================================

interface WrapperProps {
  children: React.ReactNode;
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  demoContext?: Partial<DemoContextValue>;
  themeContext?: Partial<ThemeContextValue>;
  queryClient?: QueryClient;
}

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

function createWrapper(options: CustomRenderOptions = {}): React.FC<WrapperProps> {
  const queryClient = options.queryClient ?? createTestQueryClient();
  const demoContextValue = { ...defaultDemoContext, ...options.demoContext };
  const themeContextValue = { ...defaultThemeContext, ...options.themeContext };

  return function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={queryClient}>
        <DemoContext.Provider value={demoContextValue}>
          <ThemeContext.Provider value={themeContextValue}>
            {children}
          </ThemeContext.Provider>
        </DemoContext.Provider>
      </QueryClientProvider>
    );
  };
}

// ============================================
// Custom Render Function
// ============================================

function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult & { queryClient: QueryClient } {
  const queryClient = options.queryClient ?? createTestQueryClient();
  const wrapper = createWrapper({ ...options, queryClient });
  
  const renderResult = render(ui, { wrapper, ...options });
  
  return {
    ...renderResult,
    queryClient,
  };
}

// ============================================
// Utility Functions
// ============================================

/**
 * Wait for loading states to resolve
 */
export async function waitForLoadingToFinish(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Create a deferred promise for testing async operations
 */
export function createDeferred<T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  
  return { promise, resolve, reject };
}

// ============================================
// Exports
// ============================================

export { customRender as render, createTestQueryClient, createWrapper };
export { DemoContext, ThemeContext };
export type { CustomRenderOptions, DemoContextValue, ThemeContextValue };
