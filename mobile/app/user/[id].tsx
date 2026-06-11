import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import Avatar from '../../components/ui/Avatar';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { apiGet, apiPost, apiDelete } from '../../lib/api';
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
  likesCount: number;
  isFollowing?: boolean;
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user,       setUser]       = useState<ApiUser | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState(0);
  const [fwPending,  setFwPending]  = useState(false);

  useEffect(() => {
    (async () => {
      const res = await apiGet<{ user: ApiUser }>(`/api/users/${id}`);
      if (res.success && res.data) setUser(res.data.user);
      setLoading(false);
    })();
  }, [id]);

  async function toggleFollow() {
    if (!user || fwPending) return;

    const wasFollowing = user.isFollowing ?? false;

    // Mise à jour immédiate
    setUser(u => u ? {
      ...u,
      isFollowing: !wasFollowing,
      followersCount: wasFollowing
        ? Math.max(0, u.followersCount - 1)
        : u.followersCount + 1,
    } : u);

    setFwPending(true);

    const res = wasFollowing
      ? await apiDelete(`/api/users/${user.id}/follow`)
      : await apiPost(`/api/users/${user.id}/follow`);

    // Revert si erreur
    if (!res.success) {
      setUser(u => u ? {
        ...u,
        isFollowing: wasFollowing,
        followersCount: wasFollowing
          ? u.followersCount + 1
          : Math.max(0, u.followersCount - 1),
      } : u);
    }

    setFwPending(false);
  }

  if (loading) {
    return (
      <View style={[styles.safe, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={Colors.green} size="large" />
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: Colors.gray }}>Utilisateur introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Retour</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[Colors.dark3, Colors.dark]} style={styles.topSection}>

          <View style={styles.hero}>
            <Avatar
              emoji={user.avatarEmoji}
              size={64}
              ring={user.isFollowing ? 'green' : 'none'}
              verified={user.isVerified}
            />
            <View style={styles.heroInfo}>
              <Text style={styles.name}>{user.username}</Text>
              <Text style={styles.handle}>{user.handle}</Text>
              {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
            </View>
          </View>

          <View style={styles.stats}>
            {[
              { val: formatCount(user.followersCount), label: 'Followers' },
              { val: formatCount(user.followingCount), label: 'Following' },
              { val: formatCount(user.likesCount),     label: 'Likes' },
            ].map((s, i) => (
              <View key={i} style={[styles.stat, i < 2 && styles.statBorder]}>
                <Text style={styles.statVal}>{s.val}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.btns}>
            <TouchableOpacity
              style={[styles.followBtn, user.isFollowing && styles.followingBtn]}
              onPress={toggleFollow}
              disabled={fwPending}
              activeOpacity={0.85}
            >
              {fwPending ? (
                <ActivityIndicator color={user.isFollowing ? Colors.gray : Colors.dark2} size="small" />
              ) : (
                <Text style={[styles.followBtnTxt, user.isFollowing && styles.followingBtnTxt]}>
                  {user.isFollowing ? '✓ Abonné' : '+ Suivre'}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.msgBtn}>
              <Text style={{ fontSize: 18 }}>💬</Text>
            </TouchableOpacity>
          </View>

        </LinearGradient>

        <View style={styles.tabs}>
          {['Lives passés', 'Planifiés', 'À propos'].map((t, i) => (
            <TouchableOpacity key={t} style={styles.tabItem} onPress={() => setTab(i)}>
              <Text style={[styles.tabText, tab === i && styles.tabActive]}>{t}</Text>
              {tab === i && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        {tab === 2 && (
          <View style={styles.aboutSection}>
            <Text style={styles.aboutText}>{user.bio ?? 'Aucune description.'}</Text>
          </View>
        )}

        {tab !== 2 && (
          <View style={styles.empty}>
            <Text style={{ fontSize: 36 }}>📹</Text>
            <Text style={styles.emptyText}>
              {tab === 0 ? 'Aucun live passé' : 'Aucun live planifié'}
            </Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dark },
  back: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  backText: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, color: Colors.green },
  topSection: { padding: Spacing.base, gap: Spacing.md },
  hero: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  heroInfo: { flex: 1, gap: 3 },
  name: { fontFamily: 'SpaceMono_400Regular', fontSize: Typography.sizes.lg, fontWeight: '900', color: Colors.ivory },
  handle: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, color: Colors.gray },
  bio: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, color: 'rgba(255,255,255,0.65)', marginTop: 4, lineHeight: 18 },
  stats: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border },
  stat: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md },
  statBorder: { borderRightWidth: 1, borderRightColor: Colors.border },
  statVal: { fontFamily: 'SpaceMono_400Regular', fontSize: Typography.sizes.lg, fontWeight: '900', color: Colors.ivory },
  statLabel: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.xs, color: Colors.gray, marginTop: 2 },
  btns: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  followBtn: { flex: 1, backgroundColor: Colors.green, borderRadius: Radius.lg, paddingVertical: 12, alignItems: 'center' },
  followingBtn: { backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: Colors.border },
  followBtnTxt: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.base, fontWeight: '700', color: Colors.dark2 },
  followingBtnTxt: { color: Colors.gray },
  msgBtn: { width: 44, height: 44, backgroundColor: Colors.dark3, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingHorizontal: Spacing.base },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, position: 'relative' },
  tabText: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, color: Colors.gray },
  tabActive: { color: Colors.ivory },
  tabUnderline: { position: 'absolute', bottom: -1, left: '10%', right: '10%', height: 2, backgroundColor: Colors.green, borderRadius: 1 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 10 },
  emptyText: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.base, color: Colors.gray },
  aboutSection: { padding: Spacing.base },
  aboutText: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.base, color: Colors.gray, lineHeight: 22 },
});
