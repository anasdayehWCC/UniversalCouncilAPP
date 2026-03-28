'use client';

import { useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/Toast';
import { useDemo } from '@/context/DemoContext';
import { useOptimistic } from './useOptimistic';
import { useOptimisticMutation } from './useOptimisticMutation';
import {
  applyOptimisticUpdates,
  generateOptimisticId,
  useOptimisticStore,
  selectUpdatesByType,
} from '@/lib/optimistic';
import { OptimisticUpdate } from '@/lib/optimistic/types';

// ============================================================================
// Types
// ============================================================================

export interface Favorite {
  id: string;
  entityType: 'minute' | 'template' | 'meeting' | 'case';
  entityId: string;
  userId: string;
  label?: string;
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

interface AddFavoritePayload {
  entityType: Favorite['entityType'];
  entityId: string;
  label?: string;
  notes?: string;
  tags?: string[];
}

interface UpdateFavoritePayload {
  id: string;
  label?: string;
  notes?: string;
  tags?: string[];
}

interface UseOptimisticFavoritesOptions {
  /** Filter to specific entity type */
  entityType?: Favorite['entityType'];
  /** Current user ID */
  userId?: string;
}

interface UseOptimisticFavoritesReturn {
  /** Apply optimistic updates to favorites list */
  withOptimisticUpdates: (favorites: Favorite[]) => Favorite[];
  
  // Operations
  addFavorite: ReturnType<typeof useOptimisticMutation<Favorite, AddFavoritePayload>>;
  updateFavorite: ReturnType<typeof useOptimisticMutation<Favorite, UpdateFavoritePayload>>;
  removeFavorite: ReturnType<typeof useOptimisticMutation<{ id?: string }, string>>;
  
  // Convenience methods
  toggleFavorite: (entityType: Favorite['entityType'], entityId: string) => void;
  isFavorited: (entityType: Favorite['entityType'], entityId: string, serverFavorites?: Favorite[]) => boolean;
  getFavoriteId: (entityType: Favorite['entityType'], entityId: string, serverFavorites?: Favorite[]) => string | undefined;
  
  // Batch operations
  addMultipleFavorites: (items: Array<{ entityType: Favorite['entityType']; entityId: string }>) => void;
  removeMultipleFavorites: (favoriteIds: string[]) => void;
  
  // Tags
  addTag: (favoriteId: string, tag: string) => void;
  removeTag: (favoriteId: string, tag: string) => void;
  
  // State
  hasPendingChanges: boolean;
  pendingCount: number;
  isSyncing: boolean;
  
  // Optimistic favorites (for UI without server data)
  optimisticFavorites: Favorite[];
}

// ============================================================================
// API Stubs
// ============================================================================

const favoritesApi = {
  add: async (payload: AddFavoritePayload): Promise<Favorite> => {
    const response = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to add favorite');
    return response.json();
  },
  
  update: async (payload: UpdateFavoritePayload): Promise<Favorite> => {
    const response = await fetch(`/api/favorites/${payload.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error('Failed to update favorite');
    return response.json();
  },
  
  remove: async (id: string): Promise<void> => {
    const response = await fetch(`/api/favorites/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove favorite');
  },
  
  batchAdd: async (items: Array<{ entityType: Favorite['entityType']; entityId: string }>): Promise<Favorite[]> => {
    const response = await fetch('/api/favorites/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    if (!response.ok) throw new Error('Failed to add favorites');
    return response.json();
  },
  
  batchRemove: async (ids: string[]): Promise<void> => {
    const response = await fetch('/api/favorites/batch', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) throw new Error('Failed to remove favorites');
  },
};

// ============================================================================
// Hook Implementation
// ============================================================================

export function useOptimisticFavorites(
  options: UseOptimisticFavoritesOptions = {}
): UseOptimisticFavoritesReturn {
  const { entityType: filterEntityType, userId = 'current-user' } = options;
  
  const queryClient = useQueryClient();
  const toast = useToast();
  // DemoContext is always active when useDemo() is called - treat as demo mode
  useDemo(); // For side effects if any
  const demoMode = true; // Always in demo mode when this hook is used
  
  // Get optimistic updates from store
  const allUpdates = useOptimisticStore(selectUpdatesByType('favorite'));
  
  // Core optimistic state
  const optimistic = useOptimistic<Favorite>({
    entityType: 'favorite',
    onRollback: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    config: {
      toastOnRollback: true,
      toastOnError: false, // We handle this ourselves with nicer messages
    },
  });

  // Build optimistic favorites list
  const optimisticFavorites = useMemo(() => {
    return allUpdates
      .filter((u: OptimisticUpdate) => u.status === 'pending' || u.status === 'syncing')
      .filter((u: OptimisticUpdate) => u.type === 'create')
      .map((u: OptimisticUpdate) => u.data as Favorite)
      .filter((f: Favorite) => !filterEntityType || f.entityType === filterEntityType);
  }, [allUpdates, filterEntityType]);

  // Apply optimistic updates to list
  const withOptimisticUpdates = useCallback(
    (favorites: Favorite[]): Favorite[] => {
      const updated = applyOptimisticUpdates(favorites, 'favorite');
      return filterEntityType
        ? updated.filter((f: Favorite) => f.entityType === filterEntityType)
        : updated;
    },
    [filterEntityType]
  );

  // Add favorite mutation
  const addFavorite = useOptimisticMutation<Favorite, AddFavoritePayload>({
    mutationFn: demoMode
      ? async (payload) => {
          await new Promise((resolve) => setTimeout(resolve, 200));
          return {
            id: generateOptimisticId('fav'),
            userId,
            createdAt: new Date().toISOString(),
            ...payload,
          };
        }
      : favoritesApi.add,
    getOptimisticData: (variables) => ({
      id: generateOptimisticId('fav'),
      userId,
      createdAt: new Date().toISOString(),
      ...variables,
    }),
    entityType: 'favorite',
    onSuccess: () => {
      toast.success('Added to favorites');
    },
    onError: () => {
      toast.error('Failed to add favorite', 'Please try again');
    },
    invalidateQueries: [['favorites']],
  });

  // Update favorite mutation
  const updateFavorite = useOptimisticMutation<Favorite, UpdateFavoritePayload>({
    mutationFn: demoMode
      ? async (payload) => {
          await new Promise((resolve) => setTimeout(resolve, 200));
          return {
            ...payload,
            id: payload.id,
            updatedAt: new Date().toISOString(),
          } as Favorite;
        }
      : favoritesApi.update,
    getOptimisticData: (variables) => ({
      ...variables,
      id: variables.id,
      updatedAt: new Date().toISOString(),
    } as Favorite),
    entityType: 'favorite',
    getEntityId: (variables) => variables.id,
    invalidateQueries: [['favorites']],
  });

  // Remove favorite mutation
  const removeFavorite = useOptimisticMutation<{ id?: string }, string>({
    mutationFn: demoMode
      ? async () => {
          await new Promise((resolve) => setTimeout(resolve, 200));
          return {};
        }
      : async (id) => {
          await favoritesApi.remove(id);
          return {};
        },
    getOptimisticData: () => ({}),
    entityType: 'favorite',
    getEntityId: (id) => id,
    onSuccess: () => {
      toast.success('Removed from favorites');
    },
    onError: () => {
      toast.error('Failed to remove favorite', 'Please try again');
    },
    invalidateQueries: [['favorites']],
  });

  // Check if entity is favorited (including optimistic adds)
  const isFavorited = useCallback(
    (entityType: Favorite['entityType'], entityId: string, serverFavorites?: Favorite[]): boolean => {
      // Check optimistic adds
      const optimisticallyAdded = optimisticFavorites.some(
        (f: Favorite) => f.entityType === entityType && f.entityId === entityId
      );
      if (optimisticallyAdded) return true;

      // Check server favorites if provided
      if (serverFavorites) {
        return serverFavorites.some(
          (f: Favorite) => f.entityType === entityType && f.entityId === entityId
        );
      }

      return false;
    },
    [optimisticFavorites]
  );

  // Get favorite ID for an entity
  const getFavoriteId = useCallback(
    (entityType: Favorite['entityType'], entityId: string, serverFavorites?: Favorite[]): string | undefined => {
      // Check optimistic favorites first
      const optimistic = optimisticFavorites.find(
        (f: Favorite) => f.entityType === entityType && f.entityId === entityId
      );
      if (optimistic) return optimistic.id;

      // Check server favorites
      if (serverFavorites) {
        const server = serverFavorites.find(
          (f: Favorite) => f.entityType === entityType && f.entityId === entityId
        );
        return server?.id;
      }

      return undefined;
    },
    [optimisticFavorites]
  );

  // Toggle favorite (add or remove)
  const toggleFavorite = useCallback(
    (entityType: Favorite['entityType'], entityId: string) => {
      // This is a simplified toggle - in practice you'd need the favorites list
      // to check if it exists. For now, we just add.
      addFavorite.mutate({ entityType, entityId });
    },
    [addFavorite]
  );

  // Batch add favorites
  const addMultipleFavorites = useCallback(
    (items: Array<{ entityType: Favorite['entityType']; entityId: string }>) => {
      if (demoMode) {
        items.forEach((item) => {
          addFavorite.mutate(item);
        });
        return;
      }

      // Optimistically add all
      items.forEach((item) => {
        optimistic.apply({
          id: generateOptimisticId('fav'),
          userId,
          createdAt: new Date().toISOString(),
          ...item,
        });
      });

      // Make batch API call
      favoritesApi.batchAdd(items)
        .then(() => {
          toast.success(`Added ${items.length} favorites`);
          queryClient.invalidateQueries({ queryKey: ['favorites'] });
        })
        .catch(() => {
          toast.error('Failed to add favorites');
          optimistic.rollbackAll();
        });
    },
    [demoMode, addFavorite, optimistic, userId, queryClient, toast]
  );

  // Batch remove favorites
  const removeMultipleFavorites = useCallback(
    (favoriteIds: string[]) => {
      if (demoMode) {
        favoriteIds.forEach((id) => {
          removeFavorite.mutate(id);
        });
        return;
      }

      // Make batch API call
      favoritesApi.batchRemove(favoriteIds)
        .then(() => {
          toast.success(`Removed ${favoriteIds.length} favorites`);
          queryClient.invalidateQueries({ queryKey: ['favorites'] });
        })
        .catch(() => {
          toast.error('Failed to remove favorites');
        });
    },
    [demoMode, removeFavorite, queryClient, toast]
  );

  // Add tag to favorite
  const addTag = useCallback(
    (favoriteId: string, tag: string) => {
      // Get current favorite from cache or optimistic state
      const current = queryClient.getQueryData<Favorite[]>(['favorites'])?.find(
        (f: Favorite) => f.id === favoriteId
      );
      
      const currentTags = current?.tags || [];
      if (currentTags.includes(tag)) return;

      updateFavorite.mutate({
        id: favoriteId,
        tags: [...currentTags, tag],
      });
    },
    [updateFavorite, queryClient]
  );

  // Remove tag from favorite
  const removeTag = useCallback(
    (favoriteId: string, tag: string) => {
      const current = queryClient.getQueryData<Favorite[]>(['favorites'])?.find(
        (f: Favorite) => f.id === favoriteId
      );
      
      const currentTags = current?.tags || [];
      if (!currentTags.includes(tag)) return;

      updateFavorite.mutate({
        id: favoriteId,
        tags: currentTags.filter((t: string) => t !== tag),
      });
    },
    [updateFavorite, queryClient]
  );

  // Computed state
  const hasPendingChanges = optimistic.pending.length > 0;
  const pendingCount = optimistic.pending.length;
  const isSyncing = optimistic.isSyncing;

  return {
    withOptimisticUpdates,
    addFavorite,
    updateFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorited,
    getFavoriteId,
    addMultipleFavorites,
    removeMultipleFavorites,
    addTag,
    removeTag,
    hasPendingChanges,
    pendingCount,
    isSyncing,
    optimisticFavorites,
  };
}

export default useOptimisticFavorites;
