import { View, Text, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Link, useRouter, useFocusEffect, Stack } from 'expo-router';
import { useState, useCallback } from 'react';
import { getStorage } from '@careminutes/core/storage';
import { OfflineRecording } from '@careminutes/core/storage/types';
import { syncAllQueued } from '../lib/sync';

export default function Index() {
  const [recordings, setRecordings] = useState<OfflineRecording[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      loadRecordings();
    }, [])
  );

  const loadRecordings = async () => {
    try {
      const list = await getStorage().listRecordings();
      setRecordings(list);
    } catch (e) {
      console.error('Failed to load recordings:', e);
    }
  };

  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
        await syncAllQueued(); // TODO: Pass token
        await loadRecordings();
    } catch (e) {
        console.error('Sync failed', e);
    } finally {
        setIsSyncing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
            headerRight: () => (
                <TouchableOpacity onPress={handleSync} disabled={isSyncing}>
                    <Text style={{ color: isSyncing ? '#9ca3af' : '#2563eb', fontSize: 16, fontWeight: '600' }}>
                        {isSyncing ? 'Syncing...' : 'Sync'}
                    </Text>
                </TouchableOpacity>
            )
        }}
      />
      <FlatList
        data={recordings}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.title}>{item.fileName || 'Untitled Recording'}</Text>
              <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.subtitle}>
              {new Date(item.createdAt).toLocaleString()} • {formatDuration(item.duration)}
            </Text>
            {item.case_reference && (
              <Text style={styles.meta}>Case: {item.case_reference}</Text>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recordings yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to start a new recording</Text>
          </View>
        }
      />
      <Link href="/capture" asChild>
        <TouchableOpacity style={styles.fab}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </Link>
    </SafeAreaView>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending': return '#f59e0b'; // amber-500
    case 'syncing': return '#3b82f6'; // blue-500
    case 'synced': return '#10b981'; // emerald-500
    case 'failed': return '#ef4444'; // red-500
    default: return '#6b7280'; // gray-500
  }
}

function formatDuration(ms?: number) {
  if (!ms) return '--:--';
  const seconds = Math.floor(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb', // gray-50
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e5e7eb', // gray-200
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827', // gray-900
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280', // gray-500
  },
  meta: {
    fontSize: 12,
    color: '#6b7280', // gray-500
    marginTop: 4,
    fontStyle: 'italic',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151', // gray-700
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280', // gray-500
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb', // blue-600
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: 'white',
    marginTop: -4,
  },
});
