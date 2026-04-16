import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { DemoProvider } from '@/context/DemoContext';
import { useRoleGuard } from '@/hooks/useRoleGuard';
import { PERSONAS, MEETINGS, TEMPLATES } from '@/config/personas';

function GuardProbe({ allowedRoles }: { allowedRoles: Array<'social_worker' | 'manager' | 'admin' | 'housing_officer'> }) {
  const { isReady, isAuthorized } = useRoleGuard(allowedRoles);

  return (
    <div>
      <div data-testid="ready">{String(isReady)}</div>
      <div data-testid="authorized">{String(isAuthorized)}</div>
    </div>
  );
}

describe('useRoleGuard', () => {
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

  it('redirects after hydration when the restored role is unauthorized', async () => {
    window.localStorage.setItem('currentUserId', 'david');
    window.localStorage.setItem('isAuthenticated', 'true');

    render(
      <DemoProvider>
        <GuardProbe allowedRoles={['social_worker']} />
      </DemoProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('ready')).toHaveTextContent('true');
    });

    await waitFor(() => {
      expect(screen.getByTestId('authorized')).toHaveTextContent('false');
      expect(replace).toHaveBeenCalledWith('/');
    });
  });

  it('does not redirect after hydration when the restored role is authorized', async () => {
    window.localStorage.setItem('currentUserId', 'david');
    window.localStorage.setItem('isAuthenticated', 'true');

    render(
      <DemoProvider>
        <GuardProbe allowedRoles={['manager', 'admin']} />
      </DemoProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('ready')).toHaveTextContent('true');
    });

    expect(screen.getByTestId('authorized')).toHaveTextContent('true');
    expect(replace).not.toHaveBeenCalled();
  });
});
