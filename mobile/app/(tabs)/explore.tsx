import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useAuthStore } from '../../store/auth.store';
import { apiGet, apiPost, apiDelete } from '../../lib/api';
import Avatar from '../../components/ui/Avatar';
import { formatCount } from '../../constants/mock-data';

interface ApiUser {
  id: string;
  username: string;
  handle: string;
  avatarEmoji: string;
  bio?: string;
  isVerified: boolean;
  followersCount: number;
  followingCount: number;
  isFollowing?: boolean;
}

export default function ExploreScreen() {
  const { user: me } = useAuthStore();
  const [search,    setSearch]    = useState('');
  const [users,     setUsers]     = useState<ApiUser[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [pending,   setPending]   = useState<Record<string, boolean>>({});

  const fetchUsers = useCallback(async (q?: string) => {
    setLoading(true);
    const path = q ? `/api/users?q=${encodeURIComponent(q)}` : '/api/users';
    const res = await apiGet<{ users: ApiUser[] }>(path);
    if (res.success && res.data) {
      setUsers(res.data.users.filter(u => u.id !== me?.id));
    }
    setLoading(false);
  }, [me?.id]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    if (!search) { fetchUsers(); return; }
    const t = setTimeout(() => fetchUsers(search), 400);
    return () => clearTimeout(t);
  }, [search, fetchUsers]);

  async function toggleFollow(user: ApiUser) {
    if (pending[user.id]) return;

    const wasFollowing = user.isFollowing ?? false;

    // Mise à jour immédiate de l'UI (optimiste)
    setUsers(prev => prev.map(u => u.id === user.id ? {
      ...u,
      isFollowing: !wasFollowing,
      followersCount: wasFollowing
        ? Math.max(0, u.followersCount - 1)
        : u.followersCount + 1,
    } : u));

    setPending(p => ({ ...p, [user.id]: true }));

    // Appel API en arrière-plan
    const res = wasFollowing
      ? await apiDelete(`/api/users/${user.id}/follow`)
      : await apiPost(`/api/users/${user.id}/follow`);

    // Revert si erreur
    if (!res.success) {
      setUsers(prev => prev.map(u => u.id === user.id ? {
        ...u,
        isFollowing: wasFollowing,
        followersCount: wasFollowing
          ? u.followersCount + 1
          : Math.max(0, u.followersCount - 1),
      } : u));
    }

    setPending(p => ({ ...p, [user.id]: false }));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      <View style={styles.header}>
        <Text style={styles.title}>Explorer</Text>
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un créateur..."
          placeholderTextColor={Colors.gray}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: Colors.gray, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
        <Text style={styles.sectionTitle}>
          {search ? `Résultats pour "${search}"` : 'Créateurs à suivre'}
        </Text>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.green} size="large" />
          </View>
        ) : users.length === 0 ? (
          <View style={styles.center}>
            <Text style={{ fontSize: 36 }}>🔍</Text>
            <Text style={styles.emptyText}>Aucun créateur trouvé</Text>
          </View>
        ) : (
          users.map(user => {
            const isFollowing = user.isFollowing ?? false;
            const isPending   = pending[user.id]  ?? false;

            return (
              <TouchableOpacity
                key={user.id}
                style={styles.userRow}
                onPress={() => router.push(`/user/${user.id}`)}
                activeOpacity={0.7}
              >
                <Avatar
                  emoji={user.avatarEmoji}
                  size={46}
                  ring={isFollowing ? 'green' : 'none'}
                />

                <View style={styles.userInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.username} numberOfLines={1}>{user.username}</Text>
                    {user.isVerified && <Text style={styles.check}>✓</Text>}
                  </View>
                  <Text style={styles.handle}>{user.handle}</Text>
                  <Text style={styles.stats}>{formatCount(user.followersCount)} followers</Text>
                </View>

                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); toggleFollow(user); }}
                  disabled={isPending}
                  style={[styles.followBtn, isFollowing && styles.followingBtn]}
                  activeOpacity={0.8}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {isPending ? (
                    <ActivityIndicator
                      color={isFollowing ? Colors.gray : Colors.dark2}
                      size="small"
                    />
                  ) : (
                    <Text style={[styles.followTxt, isFollowing && styles.followingTxt]}>
                      {isFollowing ? '✓ Abonné' : 'Suivre'}
                    </Text>
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dark },
  header: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: 4 },
  title: { fontFamily: 'SpaceMono_400Regular', fontSize: Typography.sizes.xl, fontWeight: '900', color: Colors.ivory },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.base, marginBottom: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: 10,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, color: Colors.ivory, fontFamily: Typography.fontBody, fontSize: Typography.sizes.base },
  list: { paddingHorizontal: Spacing.base, paddingBottom: 24, gap: 4 },
  sectionTitle: { fontFamily: 'SpaceMono_400Regular', fontSize: Typography.sizes.xs, color: Colors.gray, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: Spacing.sm },
  center: { alignItems: 'center', paddingVertical: 48, gap: Spacing.md },
  emptyText: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.base, color: Colors.gray },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  userInfo: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  username: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.base, fontWeight: '700', color: Colors.ivory, flexShrink: 1 },
  check: { fontSize: 11, color: Colors.green, fontWeight: '900' },
  handle: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.xs, color: Colors.gray },
  stats: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.xs, color: Colors.grayDim },
  followBtn: { backgroundColor: Colors.green, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 7, minWidth: 72, alignItems: 'center' },
  followingBtn: { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: Colors.border },
  followTxt: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, fontWeight: '700', color: Colors.dark2 },
  followingTxt: { color: Colors.gray },
});
