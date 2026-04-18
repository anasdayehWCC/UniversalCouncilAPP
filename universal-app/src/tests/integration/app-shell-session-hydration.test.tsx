import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { usePathname, useRouter } from 'next/navigation';
import { DemoProvider } from '@/context/DemoContext';
import { AppShell } from '@/components/layout/AppShell';
import { PERSONAS, MEETINGS, TEMPLATES } from '@/config/personas';

vi.mock('@/hooks/useTheme', () => ({
  useColorMode: () => ({
    colorMode: 'light',
    resolvedColorMode: 'light',
    isDark: false,
    isLight: true,
    isSystemMode: false,
    setColorMode: vi.fn(),
    toggleColorMode: vi.fn(),
  }),
}));

vi.mock('@/components/ThemeToggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

vi.mock('@/components/ResilienceBanner', () => ({
  ResilienceBanner: () => null,
}));

vi.mock('@/components/ConnectivityIndicator', () => ({
  ConnectivityIndicator: () => <div data-testid="connectivity-indicator" />,
}));

vi.mock('@/components/ui/AnimatedIcon', () => ({
  AnimatedIcon: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('AppShell session hydration', () => {
  const replace = vi.fn();
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    window.localStorage.clear();
    replace.mockReset();
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      replace,
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
    });
    vi.mocked(usePathname).mockReturnValue('/review-queue');

    fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        personas: PERSONAS,
        meetings: MEETINGS,
        templates: TEMPLATES,
      }),
    } as Response);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('does not redirect authenticated persisted sessions to login', async () => {
    window.localStorage.setItem('currentUserId', 'david');
    window.localStorage.setItem('isAuthenticated', 'true');

    render(
      <DemoProvider>
        <AppShell>
          <div>Protected content</div>
        </AppShell>
      </DemoProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected content')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('connectivity-indicator')).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalledWith('/login');
  });

  it('redirects unauthenticated sessions after hydration completes', async () => {
    render(
      <DemoProvider>
        <AppShell>
          <div>Protected content</div>
        </AppShell>
      </DemoProvider>
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/login');
    });

    expect(screen.queryByTestId('connectivity-indicator')).not.toBeInTheDocument();
  });
});
