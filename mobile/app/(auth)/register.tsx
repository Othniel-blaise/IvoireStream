import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Colors, Typography, Spacing } from '../../constants/theme';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleRegister() {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={['#0A120E', Colors.dark]} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <Text style={styles.backText}>← Retour</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Rejoins la vibe 🎉</Text>
            <Text style={styles.subtitle}>Crée ton compte IvoireStream gratuitement</Text>
          </View>

          <View style={styles.form}>
            <Input icon="👤" placeholder="Nom d'utilisateur" value={username} onChangeText={setUsername} autoCapitalize="none" />
            <Input icon="✉️" placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Input icon="📱" placeholder="Téléphone (Wave / MTN)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Input icon="🔒" placeholder="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />
          </View>

          <View style={styles.actions}>
            <Button label="Créer mon compte" onPress={handleRegister} loading={loading} fullWidth />
            <Text style={styles.terms}>
              En créant un compte, tu acceptes les{' '}
              <Text style={styles.link}>conditions d'utilisation</Text> et la{' '}
              <Text style={styles.link}>politique de confidentialité</Text>.
            </Text>
            <TouchableOpacity style={styles.loginRow} onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginText}>Déjà un compte ? <Text style={styles.link}>Se connecter</Text></Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dark2 },
  flex: { flex: 1 },
  scroll: { padding: Spacing.base, gap: Spacing.lg, paddingBottom: 40 },
  back: { marginTop: Spacing.sm },
  backText: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, color: Colors.green },
  header: { gap: 6 },
  title: { fontFamily: 'SpaceMono_400Regular', fontSize: Typography.sizes['2xl'], fontWeight: '900', color: Colors.ivory },
  subtitle: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.base, color: Colors.gray },
  form: { gap: Spacing.md },
  actions: { gap: Spacing.md },
  terms: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.xs, color: Colors.gray, textAlign: 'center', lineHeight: 18 },
  link: { color: Colors.green },
  loginRow: { alignItems: 'center' },
  loginText: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, color: Colors.gray },
});
