import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LiveCard from '../../components/feed/LiveCard';
import { useFeedStore } from '../../store/feed.store';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import type { LiveStream } from '../../types';

const CATEGORIES = [
  { emoji: '🎤', label: 'Musique' },
  { emoji: '💄', label: 'Beauté' },
  { emoji: '💻', label: 'Tech' },
  { emoji: '🍛', label: 'Cuisine' },
  { emoji: '😂', label: 'Comédie' },
  { emoji: '📚', label: 'Éducation' },
  { emoji: '⚽', label: 'Sport' },
  { emoji: '🎭', label: 'Lifestyle' },
];

export default function ExploreScreen() {
  const { streams } = useFeedStore();
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const filtered = streams.filter((s: LiveStream) =>
    (!search || s.title.toLowerCase().includes(search.toLowerCase()) || s.host.username.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Explorer</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Search */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un live, un créateur..."
            placeholderTextColor={Colors.gray}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cats}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.label}
              onPress={() => setActiveCat(activeCat === cat.label ? null : cat.label)}
              style={[styles.catChip, activeCat === cat.label && styles.catActive]}
            >
              <Text style={styles.catEmoji}>{cat.emoji}</Text>
              <Text style={[styles.catLabel, activeCat === cat.label && styles.catLabelActive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results */}
        <View style={styles.results}>
          <Text style={styles.sectionTitle}>
            {search ? `Résultats pour "${search}"` : 'En direct maintenant'}
          </Text>
          {filtered.map((stream: LiveStream) => (
            <LiveCard key={stream.id} stream={stream} />
          ))}
          {filtered.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>Aucun résultat</Text>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dark },
  header: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  title: { fontFamily: 'SpaceMono_400Regular', fontSize: Typography.sizes.xl, fontWeight: '900', color: Colors.ivory },
  scroll: { paddingBottom: 24, gap: Spacing.md },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.base,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: Colors.ivory, fontFamily: Typography.fontBody, fontSize: Typography.sizes.base },
  cats: { paddingHorizontal: Spacing.base, gap: Spacing.sm },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.dark3,
  },
  catActive: { borderColor: Colors.green, backgroundColor: 'rgba(25,230,128,0.08)' },
  catEmoji: { fontSize: 14 },
  catLabel: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, color: Colors.gray },
  catLabelActive: { color: Colors.green },
  results: { paddingHorizontal: Spacing.base, gap: Spacing.md },
  sectionTitle: { fontFamily: 'SpaceMono_400Regular', fontSize: Typography.sizes.xs, color: Colors.gray, letterSpacing: 2, textTransform: 'uppercase' },
  empty: { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.md },
  emptyEmoji: { fontSize: 36 },
  emptyText: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.base, color: Colors.gray },
});
