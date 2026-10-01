import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { AnimatedTabBar } from '../../components/AnimatedTabBar';
import { HomeScreen } from '../../screens/home/HomeScreen';
import { MembersScreen } from '../../screens/members/MembersScreen';
import { PaymentsScreen } from '../../screens/payments/PaymentsScreen';
import { DashboardScreen } from '../../screens/dashboard/DashboardScreen';
import { SettingsScreen } from '../../screens/settings/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <AnimatedTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="MembersTab" component={MembersScreen} />
      <Tab.Screen name="PaymentsTab" component={PaymentsScreen} />
      <Tab.Screen name="DashboardTab" component={DashboardScreen} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} />
    </Tab.Navigator>
  );
};
