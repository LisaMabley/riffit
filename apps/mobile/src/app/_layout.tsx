import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { devTools } from '../dev';

export default function RootLayout() {
  useEffect(() => {
    // Real sign-in (#5) replaces this. Until then, release builds have no signed-in user.
    void devTools?.signInAtStartup();
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </>
  );
}
