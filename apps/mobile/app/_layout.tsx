import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { setStorageAdapter } from '@careminutes/core/storage';
import { MobileStorageAdapter } from '@careminutes/core/storage/adapters/mobile';

export default function RootLayout() {
  useEffect(() => {
    // Initialize storage
    setStorageAdapter(new MobileStorageAdapter());
  }, []);

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Universal Council' }} />
      <Stack.Screen name="capture" options={{ title: 'New Recording', presentation: 'modal' }} />
    </Stack>
  );
}
