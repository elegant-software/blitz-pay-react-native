import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/lib/auth';
import { LanguageProvider } from './src/lib/LanguageContext';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/ErrorBoundary';
import { initObservability } from './src/lib/observability';
import { config } from './src/lib/config';

const linking = {
  prefixes: [`${config.trueLayerRedirectScheme}://`],
};

export default function App() {
  useEffect(() => {
    initObservability();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <LanguageProvider>
            <AuthProvider>
              <NavigationContainer linking={linking}>
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
