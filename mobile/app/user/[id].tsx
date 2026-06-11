import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { MOCK_USERS, formatCount, MOCK_PAST_LIVES } from '../../constants/mock-data';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = MOCK_USERS.find(u => u.id === id) ?? MOCK_USERS[0];
  const [following, setFollowing] = useState(user.isFollowing ?? false);
  const [tab, setTab] = useState(0);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* Back */}
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Retour</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[Colors.dark3, Colors.dark]} style={styles.topSection}>

          {/* Hero */}
          <View style={styles.hero}>
            <Avatar emoji={user.avatarEmoji} size={64} ring="green" verified={user.isVerified} />
            <View style={styles.heroInfo}>
              <Text style={styles.name}>{user.username}</Text>
              <Text style={styles.handle}>{user.handle}</Text>
              {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
            </View>
          </View>

          {/* Stats */}
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

          {/* Actions */}
          <View style={styles.btns}>
            <Button
              label={following ? '✓ Abonné' : '+ Suivre'}
              variant={following ? 'secondary' : 'primary'}
              onPress={() => setFollowing(f => !f)}
              style={styles.followBtn}
            />
            <TouchableOpacity style={styles.msgBtn}>
              <Text style={{ fontSize: 18 }}>💬</Text>
            </TouchableOpacity>
          </View>

        </LinearGradient>

        {/* Tabs */}
        <View style={styles.tabs}>
          {['Lives passés', 'Planifiés', 'À propos'].map((t, i) => (
            <TouchableOpacity key={t} style={styles.tabItem} onPress={() => setTab(i)}>
              <Text style={[styles.tabText, tab === i && styles.tabActive]}>{t}</Text>
              {tab === i && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Grid */}
        {tab === 0 && (
          <View style={styles.grid}>
            {MOCK_PAST_LIVES.map(live => (
              <TouchableOpacity key={live.id} style={styles.gridCard} activeOpacity={0.85}>
                <LinearGradient colors={['#0A1A12', '#1A2A18']} style={styles.gridThumb}>
                  <Text style={{ fontSize: 28 }}>{live.emoji}</Text>
                </LinearGradient>
                <View style={styles.gridFooter}>
                  <Text style={styles.gridViews}>👁 {formatCount(live.viewCount)} vues</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {tab === 2 && (
          <View style={styles.aboutSection}>
            <Text style={styles.aboutText}>{user.bio ?? 'Aucune description.'}</Text>
          </View>
        )}

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
  followBtn: { flex: 1 },
  msgBtn: {
    width: 44, height: 44,
    backgroundColor: Colors.dark3,
    borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingHorizontal: Spacing.base },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, position: 'relative' },
  tabText: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, color: Colors.gray },
  tabActive: { color: Colors.ivory },
  tabUnderline: { position: 'absolute', bottom: -1, left: '10%', right: '10%', height: 2, backgroundColor: Colors.green, borderRadius: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.sm, gap: Spacing.sm },
  gridCard: { width: '47%', backgroundColor: Colors.dark3, borderRadius: Radius.lg, overflow: 'hidden' },
  gridThumb: { height: 80, alignItems: 'center', justifyContent: 'center' },
  gridFooter: { padding: Spacing.sm },
  gridViews: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.xs, color: Colors.gray },
  aboutSection: { padding: Spacing.base },
  aboutText: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.base, color: Colors.gray, lineHeight: 22 },
});
