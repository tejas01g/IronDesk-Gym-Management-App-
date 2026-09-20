import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { SplashScreen } from '../../screens/splash/SplashScreen';
import { WelcomeScreen } from '../../screens/welcome/WelcomeScreen';
import { LoginScreen } from '../../screens/auth/LoginScreen';
import { GymSetupScreen } from '../../screens/setup/GymSetupScreen';
import { ChoosePlanScreen } from '../../screens/subscription/ChoosePlanScreen';
import { SubscriptionLockScreen } from '../../screens/subscription/SubscriptionLockScreen';
import { MainTabNavigator } from './MainTabNavigator';
import { AddMemberScreen } from '../../screens/members/AddMemberScreen';
import { MemberDetailScreen } from '../../screens/members/MemberDetailScreen';
import { CollectFeeScreen } from '../../screens/payments/CollectFeeScreen';
import { NotificationsScreen } from '../../screens/notifications/NotificationsScreen';
import { ManagePlansScreen } from '../../screens/plans/ManagePlansScreen';
import { WhatsAppTemplateScreen } from '../../screens/settings/WhatsAppTemplateScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="Splash"
        component={SplashScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="GymSetup"
        component={GymSetupScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ChoosePlan"
        component={ChoosePlanScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="SubscriptionLock"
        component={SubscriptionLockScreen}
        options={{ animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name="AddMember"
        component={AddMemberScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="MemberDetail"
        component={MemberDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="CollectFee"
        component={CollectFeeScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="ManagePlans"
        component={ManagePlansScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="WhatsAppTemplateEditor"
        component={WhatsAppTemplateScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
};
