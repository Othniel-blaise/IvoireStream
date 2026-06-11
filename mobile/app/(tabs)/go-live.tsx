import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Colors, Gradients, Typography, Spacing, Radius } from '../../constants/theme';

const CATEGORIES = ['🎤 Musique', '💄 Beauté', '💻 Tech', '🍛 Cuisine', '😂 Comédie', '📚 Éducation'];

export default function GoLiveScreen() {
  const [title,    setTitle]    = useState('');
  const [isPrivate, setPrivate] = useState(false);
  const [price,    setPrice]    = useState('2000');
  const [category, setCategory] = useState(0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient colors={['#0A120E', Colors.dark]} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.cancel}>Annuler</Text></TouchableOpacity>
        <Text style={styles.title}>Démarrer un Live</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.content}>
        {/* Preview */}
        <View style={styles.preview}>
          <Text style={styles.previewEmoji}>📱</Text>
          <View style={styles.previewBadge}><Text style={styles.previewBadgeText}>APERÇU</Text></View>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            icon="📝"
            placeholder="Titre de ton live..."
            value={title}
            onChangeText={setTitle}
            maxLength={60}
          />

          {/* Category */}
          <Text style={styles.sectionLabel}>CATÉGORIE</Text>
          <View style={styles.categories}>
            {CATEGORIES.map((cat, i) => (
              <TouchableOpacity
                key={cat}
                onPress={() => setCategory(i)}
                style={[styles.catChip, i === category && styles.catActive]}
              >
                <Text style={[styles.catText, i === category && styles.catTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Privacy toggle */}
          <View style={styles.row}>
            <View>
              <Text style={styles.rowLabel}>Live Privé 🔒</Text>
              <Text style={styles.rowDesc}>Accès payant fixé par toi</Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setPrivate}
              trackColor={{ false: Colors.border, true: Colors.green }}
              thumbColor={Colors.ivory}
            />
          </View>

          {isPrivate && (
            <Input
              icon="💰"
              placeholder="Prix en FCFA (ex: 2000)"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          )}
        </View>

        {/* CTA */}
        <Button
          label="⚡  Lancer le Live"
          onPress={() => router.push('/live/new')}
          fullWidth
          disabled={!title.trim()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dark },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  cancel: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.base, color: Colors.gray },
  title: { fontFamily: 'SpaceMono_400Regular', fontSize: Typography.sizes.base, fontWeight: '900', color: Colors.ivory },
  content: { flex: 1, padding: Spacing.base, gap: Spacing.lg },
  preview: {
    height: 180,
    backgroundColor: Colors.dark3,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  previewEmoji: { fontSize: 48 },
  previewBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  previewBadgeText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 9,
    color: Colors.gray,
    letterSpacing: 2,
  },
  form: { gap: Spacing.md, flex: 1 },
  sectionLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: Typography.sizes.xs,
    color: Colors.gray,
    letterSpacing: 2,
  },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  catChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.dark3,
  },
  catActive: { borderColor: Colors.green, backgroundColor: 'rgba(25,230,128,0.08)' },
  catText: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, color: Colors.gray },
  catTextActive: { color: Colors.green },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.dark3,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowLabel: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.base, fontWeight: '600', color: Colors.ivory },
  rowDesc: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.xs, color: Colors.gray, marginTop: 2 },
});
