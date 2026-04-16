import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DemoProvider, useDemo } from '@/context/DemoContext';
import { PERSONAS, MEETINGS, TEMPLATES } from '@/config/personas';

function DemoStateProbe() {
  const {
    currentUser,
    role,
    isAuthenticated,
    isSessionHydrated,
    featureFlags,
    personaHistory,
  } = useDemo();

  return (
    <div>
      <div data-testid="hydrated">{String(isSessionHydrated)}</div>
      <div data-testid="user-id">{currentUser.id}</div>
      <div data-testid="user-name">{currentUser.name}</div>
      <div data-testid="role">{role}</div>
      <div data-testid="authenticated">{String(isAuthenticated)}</div>
      <div data-testid="housing-pilot">{String(featureFlags.housingPilot)}</div>
      <div data-testid="history-count">{personaHistory.length}</div>
    </div>
  );
}

describe('DemoProvider session hydration', () => {
  const apiPersonas = {
    ...PERSONAS,
    david: {
      ...PERSONAS.david,
      name: 'David Okafor API',
    },
  };

  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    window.localStorage.clear();
    fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        personas: apiPersonas,
        meetings: MEETINGS,
        templates: TEMPLATES,
      }),
    } as Response);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('restores persisted persona, auth, flags, and history after hydration', async () => {
    window.localStorage.setItem('currentUserId', 'david');
    window.localStorage.setItem('isAuthenticated', 'true');
    window.localStorage.setItem(
      'demo_feature_flags',
      JSON.stringify({ aiInsights: true, housingPilot: true, smartCapture: false })
    );

    render(
      <DemoProvider>
        <DemoStateProbe />
      </DemoProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('hydrated')).toHaveTextContent('true');
    });

    await waitFor(() => {
      expect(screen.getByTestId('user-id')).toHaveTextContent('david');
    });

    expect(screen.getByTestId('user-name')).toHaveTextContent('David Okafor API');
    expect(screen.getByTestId('role')).toHaveTextContent('manager');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    expect(screen.getByTestId('housing-pilot')).toHaveTextContent('true');
    expect(screen.getByTestId('history-count')).toHaveTextContent('1');
  });
});
