import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients, Radius, Typography } from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: Props) {
  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[fullWidth && styles.full, style]}
      >
        <LinearGradient
          colors={Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, styles.primary, isDisabled && styles.disabled]}
        >
          {loading ? (
            <ActivityIndicator color={Colors.dark2} size="small" />
          ) : (
            <Text style={[styles.primaryText, textStyle]}>{label}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  if (variant === 'gold') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[fullWidth && styles.full, style]}
      >
        <LinearGradient
          colors={Gradients.gold}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, styles.primary, isDisabled && styles.disabled]}
        >
          {loading ? (
            <ActivityIndicator color={Colors.dark2} size="small" />
          ) : (
            <Text style={[styles.primaryText, textStyle]}>{label}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[
        styles.base,
        variant === 'secondary' && styles.secondary,
        variant === 'outline'   && styles.outline,
        variant === 'ghost'     && styles.ghost,
        isDisabled && styles.disabled,
        fullWidth && styles.full,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={Colors.ivory} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            variant === 'outline' && styles.outlineText,
            variant === 'ghost'   && styles.ghostText,
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  full: { width: '100%' },
  primary: {},
  secondary: {
    backgroundColor: Colors.dark3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  outline: {
    borderWidth: 1,
    borderColor: Colors.green,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  primaryText: {
    fontFamily: Typography.fontSyne,
    fontSize: Typography.sizes.md,
    color: Colors.dark2,
    fontWeight: '900',
  },
  text: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.base,
    color: Colors.ivory,
    fontWeight: '600',
  },
  outlineText: {
    color: Colors.green,
  },
  ghostText: {
    color: Colors.green,
  },
});
