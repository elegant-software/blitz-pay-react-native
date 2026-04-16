import React, { useEffect, useRef } from 'react';
import {
  NavigationContainer,
  createNavigationContainerRef,
  type LinkingOptions,
} from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/lib/auth';
import { LanguageProvider } from './src/lib/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { initObservability } from './src/lib/observability';
import { config } from './src/lib/config';
import { ensurePaymentsChannel } from './src/lib/notifications/channels';
import { initPushHandlers } from './src/lib/notifications/pushHandlers';
import { recoverInFlight } from './src/lib/payments/recoverInFlight';
import type { RootStackParamList } from './src/types';

const navigationRef = createNavigationContainerRef<RootStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [`${config.trueLayerRedirectScheme}://`],
  config: {
    screens: {
      PaymentResult: 'payments/:paymentRequestId/result',
      PaymentProcessing: 'payments/:paymentRequestId/processing',
      PaymentPending: 'payments/:paymentRequestId/pending',
    },
  },
};

function PostAuthEffects() {
  const { authenticated, initialized } = useAuth();
  const ranRef = useRef(false);

  useEffect(() => {
    if (!initialized || !authenticated) return;
    if (ranRef.current) return;
    ranRef.current = true;
    void recoverInFlight();
  }, [initialized, authenticated]);

  return null;
}

export default function App() {
  useEffect(() => {
    initObservability();
    void ensurePaymentsChannel();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <LanguageProvider>
            <AuthProvider>
              <NavigationContainer
                ref={navigationRef}
                linking={linking}
                onReady={() => {
                  initPushHandlers(navigationRef);
                }}
              >
                <StatusBar style="dark" />
                <PostAuthEffects />
                <AppNavigator />
              </NavigationContainer>
            </AuthProvider>
          </LanguageProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
