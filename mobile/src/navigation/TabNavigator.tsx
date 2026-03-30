import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../lib/theme';
import { useLanguage } from '../lib/LanguageContext';
import type { TabParamList, RootStackNav } from '../types';
import FloatingAvatar from '../components/FloatingAvatar';

import ExploreScreen from '../screens/ExploreScreen';
import AssistantScreen from '../screens/AssistantScreen';
import VaultScreen from '../screens/VaultScreen';
import AccountScreen from '../screens/AccountScreen';

const Tab = createBottomTabNavigator<TabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const tabIcons: Record<keyof TabParamList, { active: IoniconName; inactive: IoniconName }> = {
  Explore: { active: 'compass', inactive: 'compass-outline' },
  Assistant: { active: 'mic', inactive: 'mic-outline' },
  Vault: { active: 'wallet', inactive: 'wallet-outline' },
  Account: { active: 'person', inactive: 'person-outline' },
};

function TabsWithFloatingAvatar() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootStackNav>();

  const tabLabels: Record<keyof TabParamList, string> = {
    Explore: t('explore'),
    Assistant: t('assistant'),
    Vault: t('vault'),
    Account: t('account'),
  };

  return (
    <View style={styles.container}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            const icons = tabIcons[route.name as keyof TabParamList];
            return <Ionicons name={focused ? icons.active : icons.inactive} size={size} color={color} />;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.gray500,
          tabBarStyle: {
            ...styles.tabBar,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom + 4,
          },
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
        })}
      >
        <Tab.Screen name="Explore" component={ExploreScreen} options={{ title: tabLabels.Explore }} />
        <Tab.Screen name="Assistant" component={AssistantScreen} options={{ title: tabLabels.Assistant }} />
        <Tab.Screen name="Vault" component={VaultScreen} options={{ title: tabLabels.Vault }} />
        <Tab.Screen name="Account" component={AccountScreen} options={{ title: tabLabels.Account }} />
      </Tab.Navigator>

      {/* Floating AI avatar — sits above all tabs */}
      <FloatingAvatar onPress={() => navigation.navigate('Main')} />
    </View>
  );
}

export default function TabNavigator() {
  return <TabsWithFloatingAvatar />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  tabItem: {
    paddingTop: 6,
  },
});
