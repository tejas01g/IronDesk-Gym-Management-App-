import { NavigatorScreenParams } from '@react-navigation/native';
import { Member } from '../../types/models';

export type MainTabParamList = {
  HomeTab: undefined;
  MembersTab: undefined;
  PaymentsTab: undefined;
  AttendanceTab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Login: undefined;
  GymSetup: undefined;
  ChoosePlan: undefined;
  SubscriptionLock: undefined;
  Main: NavigatorScreenParams<MainTabParamList>;
  AddMember: { memberId?: string };
  MemberDetail: { memberId: string };
  CollectFee: { memberId?: string; member?: Member };
  Notifications: undefined;
  ManagePlans: undefined;
  WhatsAppTemplateEditor: undefined;
};
