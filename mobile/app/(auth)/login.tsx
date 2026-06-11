import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Input from '../../components/ui/Input';
import { useAuthStore } from '../../store/auth.store';

export default function LoginScreen() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);

  const { login, isLoading: loading, error, clearError } = useAuthStore();

  async function handleLogin() {
    if (!email.trim() || !password.trim()) return;
    clearError();
    await login(email.trim(), password);
    if (useAuthStore.getState().isAuthenticated) {
      router.replace('/(tabs)');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Background gradient */}
      <LinearGradient colors={['#0A120E', '#0F0F14']} style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.logoRow}>
              <Text style={styles.logoText}>IvoireStream</Text>
              <View style={styles.liveChip}>
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
          </View>

          {/* ── Hero text ── */}
          <View style={styles.heroText}>
            <Text style={styles.location}>Live from Abidjan 🇨🇮</Text>
            <Text style={styles.title}>Bon retour 👋</Text>
            <Text style={styles.subtitle}>Connecte-toi pour rejoindre la vibe</Text>
          </View>

          {/* ── Form ── */}
          <View style={styles.form}>
            <Input
              icon="✉️"
              placeholder="Email ou Téléphone"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Input
              icon="🔒"
              placeholder="Mot de passe"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
              rightIcon={showPwd ? '🙈' : '👁'}
              onRightIconPress={() => setShowPwd(v => !v)}
            />
            <TouchableOpacity onPress={() => {}} style={styles.forgotRow}>
              <Text style={styles.forgot}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
          </View>

          {/* ── Actions ── */}
          <View style={styles.actions}>

            {/* Error message */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️  {error}</Text>
              </View>
            ) : null}

            {/* Primary CTA */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.88}
              style={styles.primaryWrap}
            >
              <LinearGradient
                colors={['#19E680', '#00C060']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.primaryBtn, loading && styles.disabled]}
              >
                <Text style={styles.primaryText}>
                  {loading ? 'Connexion…' : 'Se connecter'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.divLine} />
              <Text style={styles.divText}>ou continuer avec</Text>
              <View style={styles.divLine} />
            </View>

            {/* Secondary: phone */}
            <TouchableOpacity style={styles.phoneBtn} activeOpacity={0.8} onPress={() => {}}>
              <Text style={styles.phoneBtnText}>📱  Continuer avec le téléphone</Text>
            </TouchableOpacity>

            {/* Register link */}
            <TouchableOpacity
              style={styles.registerRow}
              onPress={() => router.push('/(auth)/register')}
              activeOpacity={0.7}
            >
              <Text style={styles.registerText}>
                Pas encore de compte ?{'  '}
                <Text style={styles.registerLink}>Créer un compte</Text>
              </Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0A120E',
  },
  flex: { flex: 1 },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 20,
  },

  // Header
  header: {
    paddingTop: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 18,
    fontWeight: '900',
    color: '#19E680',
  },
  liveChip: {
    backgroundColor: '#19E680',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 8,
    fontWeight: '700',
    color: '#0A120E',
  },

  // Hero text
  heroText: {
    gap: 4,
    marginTop: 4,
  },
  location: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 11,
    color: '#7A8A82',
  },
  title: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 28,
    fontWeight: '900',
    color: '#F6F8F7',
    lineHeight: 34,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#7A8A82',
    marginTop: 2,
  },

  // Form
  form: {
    gap: 12,
  },
  forgotRow: {
    alignSelf: 'flex-end',
  },
  forgot: {
    fontSize: 12,
    color: '#19E680',
  },

  // Error
  errorBox: {
    backgroundColor: 'rgba(255,59,85,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,85,0.3)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B55',
    lineHeight: 18,
  },

  // Actions
  actions: {
    gap: 14,
    marginTop: 4,
  },
  primaryWrap: {
    width: '100%',
  },
  primaryBtn: {
    borderRadius: 13,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#19E680',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  disabled: { opacity: 0.55 },
  primaryText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 14,
    fontWeight: '900',
    color: '#0A120E',
    letterSpacing: 0.3,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  divLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  divText: {
    fontSize: 11,
    color: '#7A8A82',
  },

  phoneBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 13,
    paddingVertical: 13,
    alignItems: 'center',
  },
  phoneBtnText: {
    fontSize: 13,
    color: '#F6F8F7',
  },

  registerRow: {
    alignItems: 'center',
    paddingTop: 4,
  },
  registerText: {
    fontSize: 12,
    color: '#7A8A82',
  },
  registerLink: {
    color: '#19E680',
  },
});
