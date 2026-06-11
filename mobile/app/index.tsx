import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { useAuthStore } from '../store/auth.store';

export default function SplashScreen() {
  // Animations
  const fadeIn      = useRef(new Animated.Value(0)).current;
  const scaleIn     = useRef(new Animated.Value(0.82)).current;
  const boltGlow    = useRef(new Animated.Value(0)).current;
  const progressVal = useRef(new Animated.Value(0)).current;
  const pctVal      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1 — Fade + scale in
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.spring(scaleIn, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
    ]).start();

    // 2 — Bolt glow pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(boltGlow, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
        Animated.timing(boltGlow, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: false }),
      ])
    ).start();

    // 3 — Progress bar 0 → 1 in 2.4s
    Animated.timing(progressVal, {
      toValue: 1,
      duration: 2400,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // 4 — Percentage counter 0 → 100 in 2.4s
    Animated.timing(pctVal, {
      toValue: 100,
      duration: 2400,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // 5 — Check auth + navigate after splash
    let cancelled = false;
    Promise.all([
      new Promise(r => setTimeout(r, 2800)),
      useAuthStore.getState().initialize(),
    ]).then(() => {
      if (cancelled) return;
      const { isAuthenticated } = useAuthStore.getState();
      router.replace(isAuthenticated ? '/(tabs)' : '/(auth)/login');
    });
    return () => { cancelled = true; };
  }, []);

  const glowRadius = boltGlow.interpolate({ inputRange: [0, 1], outputRange: [80, 140] });
  const glowOpacity = boltGlow.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.22] });
  const barWidth = progressVal.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.root}>

      {/* ── Dark background ── */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0A120E' }]} />

      {/* ── Radial ambient glow (simulated with concentric circles) ── */}
      <Animated.View
        style={[
          styles.glowOuter,
          {
            width: glowRadius,
            height: glowRadius,
            borderRadius: 140,
            opacity: glowOpacity,
            marginLeft: -70,
            marginTop: -70,
          },
        ]}
      />
      <View style={styles.glowInner} />

      {/* ── Main content ── */}
      <Animated.View
        style={[
          styles.center,
          {
            opacity: fadeIn,
            transform: [{ scale: scaleIn }],
          },
        ]}
      >
        {/* Bolt */}
        <Animated.Text
          style={[
            styles.bolt,
            {
              textShadowRadius: boltGlow.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 28],
              }),
              textShadowColor: '#19E680',
            },
          ]}
        >
          ⚡
        </Animated.Text>

        {/* Wordmark — gradient "IvoireStream" */}
        <MaskedView
          maskElement={
            <Text style={styles.wordmark}>IvoireStream</Text>
          }
        >
          <LinearGradient
            colors={['#19E680', '#00C060', '#FF8C00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={[styles.wordmark, { opacity: 0 }]}>IvoireStream</Text>
          </LinearGradient>
        </MaskedView>

        {/* Tagline */}
        <Text style={styles.tagline}>STREAM IVOIRIEN</Text>
      </Animated.View>

      {/* ── Progress bar ── */}
      <Animated.View style={[styles.barWrap, { opacity: fadeIn }]}>
        <View style={styles.barBg}>
          <Animated.View style={[styles.barFill, { width: barWidth }]}>
            <LinearGradient
              colors={['#19E680', '#00C060']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        <Animated.Text style={styles.pct}>
          {pctVal.interpolate({
            inputRange: Array.from({ length: 101 }, (_, i) => i),
            outputRange: Array.from({ length: 101 }, (_, i) => `${i}%`),
          })}
        </Animated.Text>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A120E',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Glow circles simulating radial gradient
  glowOuter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    backgroundColor: '#19E680',
    // borderRadius set inline from animated value
  },
  glowInner: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -40,
    backgroundColor: '#19E680',
    opacity: 0.06,
  },

  center: {
    alignItems: 'center',
    gap: 10,
    zIndex: 1,
  },

  bolt: {
    fontSize: 56,
    textShadowOffset: { width: 0, height: 0 },
  },

  wordmark: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: '#19E680',
  },

  tagline: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: '#7A8A82',
    letterSpacing: 5,
    marginTop: 4,
  },

  // Progress bar
  barWrap: {
    position: 'absolute',
    bottom: 60,
    left: 48,
    right: 48,
    zIndex: 1,
  },
  barBg: {
    height: 3,
    backgroundColor: 'rgba(25,230,128,0.12)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  pct: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: '#19E680',
    textAlign: 'right',
    marginTop: 6,
  },
});
