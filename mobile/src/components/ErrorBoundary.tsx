import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, radius } from '../lib/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary]', error.message, error.stack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Something went wrong</Text>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.errorName}>{this.state.error?.name}</Text>
          <Text style={styles.errorMessage}>{this.state.error?.message}</Text>
          {__DEV__ && this.state.error?.stack && (
            <Text style={styles.stack} selectable>
              {this.state.error.stack}
            </Text>
          )}
          {__DEV__ && this.state.errorInfo?.componentStack && (
            <Text style={styles.stack} selectable>
              {this.state.errorInfo.componentStack}
            </Text>
          )}
        </ScrollView>
        <TouchableOpacity style={styles.button} onPress={this.handleReset}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  scroll: {
    maxHeight: 400,
    marginBottom: spacing.lg,
  },
  scrollContent: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
  },
  errorName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 4,
  },
  errorMessage: {
    fontSize: 14,
    color: colors.gray700,
    marginBottom: spacing.sm,
  },
  stack: {
    fontSize: 11,
    color: colors.gray600,
    fontFamily: 'monospace',
    marginTop: spacing.sm,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    padding: spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
  },
});
