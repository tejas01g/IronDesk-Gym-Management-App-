import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { colors, radius, shadows, spacing, fontFamilies } from '../theme';
import { haptic } from '../utils/haptics';
import {
  Home,
  Users,
  CreditCard,
  LayoutDashboard,
  Settings,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_MARGIN = spacing.lg;
const TAB_BAR_WIDTH = SCREEN_WIDTH - TAB_BAR_MARGIN * 2;

const ICONS: Record<string, any> = {
  HomeTab: Home,
  MembersTab: Users,
  PaymentsTab: CreditCard,
  DashboardTab: LayoutDashboard,
  SettingsTab: Settings,
};

const LABELS: Record<string, string> = {
  HomeTab: 'Home',
  MembersTab: 'Members',
  PaymentsTab: 'Payments',
  DashboardTab: 'Dashboard',
  SettingsTab: 'Settings',
};

interface TabItemProps {
  route: any;
  index: number;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  totalTabs: number;
}

const TabItem: React.FC<TabItemProps> = ({
  route,
  isFocused,
  onPress,
  onLongPress,
}) => {
  const IconComponent = ICONS[route.name] || Home;
  const label = LABELS[route.name] || route.name;

  const scale = useSharedValue(isFocused ? 1.15 : 1);
  const labelOpacity = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1.15 : 1, {
      damping: 14,
      stiffness: 160,
    });
    labelOpacity.value = withTiming(isFocused ? 1 : 0, { duration: 180 });
  }, [isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [
      {
        translateY: interpolate(labelOpacity.value, [0, 1], [4, 0]),
      },
    ],
  }));

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      onPress={() => {
        haptic.light();
        onPress();
      }}
      onLongPress={onLongPress}
      style={styles.tabButton}
      activeOpacity={0.8}
    >
      <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
        <IconComponent
          size={22}
          color={isFocused ? colors.primary : colors.textMuted}
          strokeWidth={isFocused ? 2.5 : 2}
        />
      </Animated.View>
      {isFocused ? (
        <Animated.Text
          numberOfLines={1}
          style={[styles.activeLabel, animatedLabelStyle]}
        >
          {label}
        </Animated.Text>
      ) : null}
    </TouchableOpacity>
  );
};

export const AnimatedTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const totalTabs = state.routes.length;
  const tabWidth = TAB_BAR_WIDTH / totalTabs;
  const indicatorPosition = useSharedValue(state.index * tabWidth);

  useEffect(() => {
    indicatorPosition.value = withSpring(state.index * tabWidth, {
      damping: 18,
      stiffness: 180,
    });
  }, [state.index, tabWidth]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value }],
    width: tabWidth,
  }));

  return (
    <View style={styles.outerContainer}>
      <View style={styles.barContainer}>
        {/* Gliding Lime Indicator */}
        <Animated.View style={[styles.indicatorWrapper, animatedIndicatorStyle]}>
          <View style={styles.indicatorPill} />
        </Animated.View>

        {/* Tab Items */}
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabItem
              key={route.key}
              route={route}
              index={index}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              totalTabs={totalTabs}
            />
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: TAB_BAR_MARGIN,
    right: TAB_BAR_MARGIN,
    alignItems: 'center',
  },
  barContainer: {
    flexDirection: 'row',
    width: TAB_BAR_WIDTH,
    height: 64,
    backgroundColor: '#15151BF2', // card surface with high opacity
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    ...shadows.floatingBar,
  },
  indicatorWrapper: {
    position: 'absolute',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorPill: {
    width: 44,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeLabel: {
    fontFamily: fontFamilies.tabLabel,
    fontSize: 10,
    color: colors.primary,
    marginTop: 2,
    letterSpacing: 0.3,
  },
});
