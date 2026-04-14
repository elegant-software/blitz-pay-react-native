import React, { useEffect, useRef } from 'react';
import { Linking } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/lib/auth';
import { LanguageProvider } from './src/lib/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { initObservability } from './src/lib/observability';
import type { RootStackParamList } from './src/types';
import { isTrueLayerRedirectUrl, savePendingTrueLayerReturnUrl } from './src/lib/truelayer';

export default function App() {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const pendingRedirectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    initObservability();
  }, []);

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!isTrueLayerRedirectUrl(url)) {
        return;
      }

      const currentRouteName = navigationRef.isReady()
        ? navigationRef.getCurrentRoute()?.name
        : null;

      if (currentRouteName === 'Checkout') {
        return;
      }

      pendingRedirectUrlRef.current = url;
      await savePendingTrueLayerReturnUrl(url);

      if (navigationRef.isReady()) {
        navigationRef.navigate('Checkout');
        pendingRedirectUrlRef.current = null;
      }
    };

    void Linking.getInitialURL().then((url) => {
      void handleUrl(url);
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, [navigationRef]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <LanguageProvider>
            <AuthProvider>
              <NavigationContainer
                ref={navigationRef}
                onReady={() => {
                  const pendingRedirectUrl = pendingRedirectUrlRef.current;
                  if (pendingRedirectUrl && navigationRef.getCurrentRoute()?.name !== 'Checkout') {
                    navigationRef.navigate('Checkout');
                    pendingRedirectUrlRef.current = null;
                  }
                }}
              >
                <StatusBar style="dark" />
                <AppNavigator />
              </NavigationContainer>
            </AuthProvider>
          </LanguageProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
