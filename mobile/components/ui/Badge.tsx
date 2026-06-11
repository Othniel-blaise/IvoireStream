import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Typography, Radius } from '../../constants/theme';

type Variant = 'live' | 'gold' | 'green' | 'gray';

interface Props {
  label?: string;
  variant?: Variant;
  pulse?: boolean;
  style?: object;
}

export default function Badge({ label, variant = 'live', pulse = false, style }: Props) {
  const dotOpacity = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (!pulse) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(dotOpacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(dotOpacity, { toValue: 1,   duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const bg = {
    live:   Colors.red,
    gold:   Colors.gold,
    green:  'rgba(25,230,128,0.15)',
    gray:   'rgba(255,255,255,0.1)',
  }[variant];

  const color = {
    live:   Colors.white,
    gold:   Colors.dark2,
    green:  Colors.green,
    gray:   Colors.gray,
  }[variant];

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      {(variant === 'live') && (
        <Animated.View style={[styles.dot, { opacity: dotOpacity }]} />
      )}
      {label && <Text style={[styles.text, { color }]}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.white,
  },
  text: {
    fontFamily: Typography.fontMono,
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
