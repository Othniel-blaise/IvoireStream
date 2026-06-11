import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Input from '../../components/ui/Input';
import { useAuthStore } from '../../store/auth.store';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [handle,   setHandle]   = useState('');
  const [email,    setEmail]    = useState('');
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);

  const { register, isLoading, error, clearError } = useAuthStore();

  async function handleRegister() {
    if (!username.trim() || !email.trim() || !password.trim()) return;
    clearError();
    await register({
      username:    username.trim(),
      handle:      handle.trim() || username.trim().replace(/\s+/g, '_'),
      email:       email.trim(),
      password,
      phone:       phone.trim() || undefined,
      avatarEmoji: '😊',
    });
    if (useAuthStore.getState().isAuthenticated) {
      router.replace('/(tabs)');
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#0A120E', Colors.dark]} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Rejoins la vibe 🎉</Text>
            <Text style={styles.subtitle}>Crée ton compte IvoireStream gratuitement</Text>
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️  {error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Input
              icon="👤"
              placeholder="Nom d'affichage (ex: Kouadio DJ)"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="words"
            />
            <Input
              icon="@"
              placeholder="Handle (ex: kouadio_dj)"
              value={handle}
              onChangeText={setHandle}
              autoCapitalize="none"
            />
            <Input
              icon="✉️"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
            <Input
              icon="📱"
              placeholder="Téléphone Wave / MTN (optionnel)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Input
              icon="🔒"
              placeholder="Mot de passe (min. 8 caractères)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
              rightIcon={showPwd ? '🙈' : '👁'}
              onRightIconPress={() => setShowPwd(v => !v)}
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.88}
              style={styles.primaryWrap}
            >
              <LinearGradient
                colors={['#19E680', '#00C060']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.primaryBtn, isLoading && styles.disabled]}
              >
                <Text style={styles.primaryText}>
                  {isLoading ? 'Création en cours…' : 'Créer mon compte'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.terms}>
              En créant un compte, tu acceptes les{' '}
              <Text style={styles.link}>conditions d'utilisation</Text>.
            </Text>

            <TouchableOpacity
              style={styles.loginRow}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.loginText}>
                Déjà un compte ?{'  '}
                <Text style={styles.link}>Se connecter</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: '#0A120E' },
  flex:  { flex: 1 },
  scroll: { padding: Spacing.base, gap: Spacing.lg, paddingBottom: 40, flexGrow: 1 },
  back:  { marginTop: Spacing.sm },
  backText: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, color: Colors.green },
  header: { gap: 6 },
  title:  { fontFamily: 'SpaceMono_400Regular', fontSize: Typography.sizes['2xl'], fontWeight: '900', color: Colors.ivory },
  subtitle: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.base, color: Colors.gray },
  errorBox: {
    backgroundColor: 'rgba(255,59,85,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,59,85,0.3)',
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  errorText: { fontSize: 12, color: '#FF3B55', lineHeight: 18 },
  form:    { gap: Spacing.md },
  actions: { gap: Spacing.md },
  primaryWrap: { width: '100%' },
  primaryBtn: {
    borderRadius: 13,
    paddingVertical: 14,
    alignItems: 'center',
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
  },
  terms: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.xs, color: Colors.gray, textAlign: 'center', lineHeight: 18 },
  link:  { color: Colors.green },
  loginRow: { alignItems: 'center', paddingTop: 4 },
  loginText: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, color: Colors.gray },
});
