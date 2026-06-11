import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/theme';

type Ring = 'green' | 'orange' | 'gray' | 'none';

interface Props {
  emoji: string;
  size?: number;
  ring?: Ring;
  verified?: boolean;
}

// expo-linear-gradient requires a tuple of at least 2 color values
type ColorTuple = readonly [string, string, ...string[]];

const RING_COLORS: Record<Ring, ColorTuple> = {
  green:  [Colors.green, Colors.green2],
  orange: [Colors.orange, Colors.gold],
  gray:   ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)'],
  none:   ['transparent', 'transparent'],
};

export default function Avatar({ emoji, size = 44, ring = 'none', verified = false }: Props) {
  const innerSize  = size - 6;
  const fontSize   = size * 0.42;
  const verifySize = size * 0.35;

  if (ring === 'none') {
    return (
      <View style={[styles.plain, { width: size, height: size, borderRadius: size / 2, backgroundColor: Colors.dark3 }]}>
        <Text style={{ fontSize }}>{emoji}</Text>
        {verified && (
          <View style={[styles.verify, { width: verifySize, height: verifySize, borderRadius: verifySize / 2, right: -2, bottom: -2 }]}>
            <Text style={{ fontSize: verifySize * 0.55 }}>✓</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={{ position: 'relative' }}>
      <LinearGradient
        colors={RING_COLORS[ring]}
        style={{ width: size, height: size, borderRadius: size / 2, padding: 2, alignItems: 'center', justifyContent: 'center' }}
      >
        <View style={[styles.inner, { width: innerSize, height: innerSize, borderRadius: innerSize / 2 }]}>
          <Text style={{ fontSize }}>{emoji}</Text>
        </View>
      </LinearGradient>
      {verified && (
        <View style={[styles.verify, { width: verifySize, height: verifySize, borderRadius: verifySize / 2, right: -2, bottom: -2 }]}>
          <Text style={{ fontSize: verifySize * 0.55 }}>✓</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  plain: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    backgroundColor: Colors.dark3,
    borderWidth: 2,
    borderColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verify: {
    position: 'absolute',
    backgroundColor: Colors.green,
    borderWidth: 2,
    borderColor: Colors.dark2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
