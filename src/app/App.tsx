import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, StatusBar, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { RootNavigator } from './navigation/RootNavigator';
import { colors, fontFamilies, radius, spacing } from '../theme';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[RootErrorBoundary] Unhandled error:', error, errorInfo);
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <StatusBar barStyle="light-content" backgroundColor={colors.background} />
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>SOMETHING WENT WRONG</Text>
            <Text style={styles.errorMessage}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={this.handleRestart}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>RETRY</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const customDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

export const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <RootErrorBoundary>
          <StatusBar
            barStyle="light-content"
            backgroundColor={colors.background}
            translucent={false}
          />
          <NavigationContainer theme={customDarkTheme}>
            <RootNavigator />
          </NavigationContainer>
        </RootErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  errorCard: {
    width: '100%',
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.danger,
    alignItems: 'center',
  },
  errorTitle: {
    fontFamily: fontFamilies.heading,
    fontSize: 24,
    color: colors.danger,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontFamily: fontFamilies.bodyRegular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  retryButton: {
    backgroundColor: colors.primary,
    height: 48,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    fontFamily: fontFamilies.heading,
    fontSize: 16,
    color: colors.black,
    letterSpacing: 1,
  },
});

export default App;
