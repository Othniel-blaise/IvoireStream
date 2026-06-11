import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, TextInputProps } from 'react-native';
import { Colors, Typography, Radius, Spacing } from '../../constants/theme';

interface Props extends TextInputProps {
  icon?: string;
  error?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
}

export default function Input({ icon, error, rightIcon, onRightIconPress, style, ...props }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View>
      <View style={[
        styles.wrap,
        focused && styles.focused,
        !!error && styles.errored,
        style as object,
      ]}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <TextInput
          {...props}
          placeholderTextColor={Colors.grayDim}
          style={styles.input}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e)  => { setFocused(false); props.onBlur?.(e); }}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} activeOpacity={0.7}>
            <Text style={styles.icon}>{rightIcon}</Text>
          </TouchableOpacity>
        )}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  focused: {
    borderColor: Colors.green,
    backgroundColor: 'rgba(25,230,128,0.04)',
  },
  errored: {
    borderColor: Colors.red,
  },
  icon: {
    fontSize: 16,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    color: Colors.ivory,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.base,
  },
  error: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.xs,
    color: Colors.red,
    marginTop: 4,
    marginLeft: 4,
  },
});
