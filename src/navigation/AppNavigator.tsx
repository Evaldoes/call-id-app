import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  BottomNavigation,
  BottomNavigationTab,
  Icon,
  IconElement,
} from '@ui-kitten/components';
import { CallsScreen } from '../features/calls/screens/CallsScreen';
import { CallDetailScreen } from '../features/calls/screens/CallDetailScreen';
import { LookupScreen } from '../features/lookup/screens/LookupScreen';
import { OsintScreen } from '../features/osint/screens/OsintScreen';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';

// ── Tipos de rota ──────────────────────────────────────────────────────────
export type CallsStackParams = {
  CallsList: undefined;
  CallDetail: { callId: string };
};

// ── Stack da aba Chamadas ──────────────────────────────────────────────────
const CallsStack = createNativeStackNavigator<CallsStackParams>();

function CallsNavigator() {
  return (
    <CallsStack.Navigator screenOptions={{ headerShown: false }}>
      <CallsStack.Screen name="CallsList"   component={CallsScreen} />
      <CallsStack.Screen name="CallDetail"  component={CallDetailScreen} />
    </CallsStack.Navigator>
  );
}

// ── Bottom tabs ────────────────────────────────────────────────────────────
const Tab = createBottomTabNavigator();

const CallsIcon    = (p: object): IconElement => <Icon {...p} name="phone-call-outline" />;
const SearchIcon   = (p: object): IconElement => <Icon {...p} name="search-outline" />;
const OsintIcon    = (p: object): IconElement => <Icon {...p} name="shield-outline" />;
const SettingsIcon = (p: object): IconElement => <Icon {...p} name="settings-2-outline" />;

function BottomTabBar({ navigation, state }: { navigation: any; state: any }) {
  return (
    <BottomNavigation
      selectedIndex={state.index}
      onSelect={(i) => navigation.navigate(state.routeNames[i])}>
      <BottomNavigationTab title="Chamadas" icon={CallsIcon} />
      <BottomNavigationTab title="Consultar" icon={SearchIcon} />
      <BottomNavigationTab title="OSINT"    icon={OsintIcon} />
      <BottomNavigationTab title="Config"   icon={SettingsIcon} />
    </BottomNavigation>
  );
}

export function AppNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Calls"    component={CallsNavigator} />
      <Tab.Screen name="Lookup"   component={LookupScreen} />
      <Tab.Screen name="Osint"    component={OsintScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
