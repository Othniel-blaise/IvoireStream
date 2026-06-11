import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../../components/ui/Avatar';
import { useAuthStore } from '../../store/auth.store';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { formatCount, MOCK_PAST_LIVES } from '../../constants/mock-data';

const PROFILE_TABS = ['Lives passés', 'Planifiés', 'À propos'] as const;

export default function ProfileScreen() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState(0);

  if (!user) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Hero banner ── */}
        <View style={styles.banner}>
          <LinearGradient
            colors={[Colors.dark3, Colors.dark2, Colors.dark]}
            style={StyleSheet.absoluteFill}
          />
          {/* Decorative glow */}
          <View style={styles.bannerGlow} />

          {/* Top row: settings icon */}
          <View style={styles.bannerTop}>
            <TouchableOpacity style={styles.iconBtn}>
              <Text style={{ fontSize: 14 }}>⋯</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Text style={{ fontSize: 14 }}>⚙️</Text>
            </TouchableOpacity>
          </View>

          {/* Avatar + identity */}
          <View style={styles.heroRow}>
            <Avatar emoji={user.avatarEmoji} size={72} ring="green" verified={user.isVerified} />
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{user.username}</Text>
              <Text style={styles.heroHandle}>{user.handle}</Text>
              {user.bio && (
                <Text style={styles.heroBio} numberOfLines={2}>{user.bio}</Text>
              )}
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            {[
              { val: formatCount(user.followersCount), label: 'Followers' },
              { val: formatCount(user.followingCount), label: 'Following' },
              { val: formatCount(user.likesCount),     label: 'Likes' },
            ].map((s, i) => (
              <View key={i} style={[styles.stat, i < 2 && styles.statDivider]}>
                <Text style={styles.statVal}>{s.val}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.editBtn}>
              <Text style={styles.editBtnText}>✏️  Modifier le profil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn}>
              <Text style={{ fontSize: 14 }}>🔗</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Tabs ── */}
        <View style={styles.tabs}>
          {PROFILE_TABS.map((t, i) => (
            <TouchableOpacity
              key={t}
              style={styles.tabItem}
              onPress={() => setTab(i)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, tab === i && styles.tabActive]}>{t}</Text>
              {tab === i && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Tab content ── */}
        {tab === 0 && (
          <View style={styles.grid}>
            {MOCK_PAST_LIVES.map(live => (
              <TouchableOpacity key={live.id} style={styles.gridCard} activeOpacity={0.85}>
                <LinearGradient
                  colors={['#0A1A12', '#1A2A18']}
                  style={styles.gridThumb}
                >
                  <Text style={{ fontSize: 30 }}>{live.emoji}</Text>
                  {/* Viewer overlay */}
                  <View style={styles.gridOverlay}>
                    <Text style={styles.gridViews}>👁 {formatCount(live.viewCount)}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {tab === 1 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyTitle}>Aucun live planifié</Text>
            <Text style={styles.emptyHint}>Planifie ton prochain live pour prévenir tes abonnés</Text>
          </View>
        )}

        {tab === 2 && (
          <View style={styles.about}>
            <Text style={styles.aboutText}>{user.bio ?? 'Pas encore de bio.'}</Text>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutIcon}>📍</Text>
              <Text style={styles.aboutMeta}>Abidjan, Côte d'Ivoire</Text>
            </View>
            <View style={styles.aboutRow}>
              <Text style={styles.aboutIcon}>🎙</Text>
              <Text style={styles.aboutMeta}>Créateur · IvoireStream</Text>
            </View>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dark },

  // Banner / hero
  banner: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
    overflow: 'hidden',
  },
  bannerGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(25,230,128,0.05)',
  },
  bannerTop: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  iconBtn: {
    width: 34,
    height: 34,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  heroInfo: { flex: 1, gap: 3 },
  heroName: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: Typography.sizes.lg,
    fontWeight: '900',
    color: Colors.ivory,
  },
  heroHandle: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.sm,
    color: Colors.gray,
  },
  heroBio: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.sm,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 18,
    marginTop: 4,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statDivider: {
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  statVal: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: Typography.sizes.lg,
    fontWeight: '900',
    color: Colors.ivory,
  },
  statLabel: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.xs,
    color: Colors.gray,
    marginTop: 2,
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  editBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 11,
    alignItems: 'center',
  },
  editBtnText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.ivory,
  },
  shareBtn: {
    width: 42,
    height: 42,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.base,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    position: 'relative',
  },
  tabText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.sm,
    color: Colors.gray,
  },
  tabActive: {
    color: Colors.ivory,
    fontWeight: '600',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: -1,
    left: '15%',
    right: '15%',
    height: 2,
    backgroundColor: Colors.green,
    borderRadius: 1,
  },

  // Past lives grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  gridCard: {
    width: '47.5%',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gridThumb: {
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  gridViews: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.xs,
    color: Colors.gray,
  },

  // Empty states
  empty: {
    alignItems: 'center',
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.sm,
  },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: Typography.sizes.base,
    color: Colors.ivory,
    fontWeight: '700',
  },
  emptyHint: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.sm,
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 18,
  },

  // About tab
  about: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  aboutText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.base,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 22,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  aboutIcon: { fontSize: 14 },
  aboutMeta: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.sm,
    color: Colors.gray,
  },
});
