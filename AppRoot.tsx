import React from 'react';
import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useCallMonitor } from './src/features/calls/hooks/useCallMonitor';
import { useAutoImport } from './src/features/calls/hooks/useAutoImport';

function AppContent() {
  useCallMonitor();
  useAutoImport();
  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}

export default function AppRoot() {
  return (
    <>
      <IconRegistry icons={EvaIconsPack} />
      <ApplicationProvider {...eva} theme={eva.dark}>
        <SafeAreaProvider>
          <NavigationContainer>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <AppContent />
            </GestureHandlerRootView>
          </NavigationContainer>
        </SafeAreaProvider>
      </ApplicationProvider>
    </>
  );
}
