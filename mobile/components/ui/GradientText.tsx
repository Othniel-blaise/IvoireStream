import { Text, TextStyle, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/theme';

type ColorTuple = readonly [string, string, ...string[]];

interface Props {
  children: string;
  style?: TextStyle;
  colors?: ColorTuple;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export default function GradientText({
  children,
  style,
  colors = [Colors.green, Colors.green2, Colors.orange],
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
}: Props) {
  return (
    <LinearGradient colors={colors} start={start} end={end}>
      <Text style={[styles.base, style, styles.transparent]}>{children}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base:        { fontWeight: '900' },
  transparent: { opacity: 0 },
});
