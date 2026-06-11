import { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Avatar from '../../components/ui/Avatar';
import { useAuthStore } from '../../store/auth.store';
import { apiPatch } from '../../lib/api';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { formatCount, MOCK_PAST_LIVES } from '../../constants/mock-data';

const PROFILE_TABS = ['Lives passés', 'Planifiés', 'À propos'] as const;

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const [tab,        setTab]        = useState(0);
  const [showEdit,   setShowEdit]   = useState(false);
  const [editName,   setEditName]   = useState(user?.username ?? '');
  const [editBio,    setEditBio]    = useState(user?.bio ?? '');
  const [editEmoji,  setEditEmoji]  = useState(user?.avatarEmoji ?? '👤');
  const [saving,     setSaving]     = useState(false);

  if (!user) return null;

  async function handleLogout() {
    Alert.alert('Déconnexion', 'Tu veux vraiment te déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  }

  async function handleSaveProfile() {
    setSaving(true);
    const res = await apiPatch('/api/users/me', {
      username: editName.trim(),
      bio: editBio.trim(),
      avatarEmoji: editEmoji,
    });
    setSaving(false);
    if (res.success) {
      setShowEdit(false);
    } else {
      Alert.alert('Erreur', res.error ?? 'Impossible de sauvegarder');
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Hero banner ── */}
        <View style={styles.banner}>
          <LinearGradient
            colors={[Colors.dark3, Colors.dark2, Colors.dark]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.bannerGlow} />

          {/* Top row */}
          <View style={styles.bannerTop}>
            <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
              <Text style={{ fontSize: 14 }}>🚪</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
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
            <TouchableOpacity style={styles.editBtn} onPress={() => setShowEdit(true)}>
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
            <TouchableOpacity key={t} style={styles.tabItem} onPress={() => setTab(i)} activeOpacity={0.7}>
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
                <LinearGradient colors={['#0A1A12', '#1A2A18']} style={styles.gridThumb}>
                  <Text style={{ fontSize: 30 }}>{live.emoji}</Text>
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
          </View>
        )}

        {tab === 2 && (
          <View style={styles.about}>
            <Text style={styles.aboutText}>{user.bio ?? 'Pas encore de bio.'}</Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Modal visible={showEdit} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Modifier le profil</Text>

            <Text style={styles.label}>Emoji avatar</Text>
            <TextInput
              style={styles.emojiInput}
              value={editEmoji}
              onChangeText={setEditEmoji}
              maxLength={4}
            />

            <Text style={styles.label}>Nom d'affichage</Text>
            <TextInput
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              placeholderTextColor={Colors.gray}
              placeholder="Ton nom"
            />

            <Text style={styles.label}>Bio</Text>
            <TextInput
              style={[styles.modalInput, styles.bioInput]}
              value={editBio}
              onChangeText={setEditBio}
              placeholderTextColor={Colors.gray}
              placeholder="Parle de toi..."
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowEdit(false)}
              >
                <Text style={styles.cancelTxt}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color={Colors.dark2} size="small" />
                  : <Text style={styles.saveTxt}>Sauvegarder</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dark },
  banner: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.lg, gap: Spacing.md, overflow: 'hidden' },
  bannerGlow: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(25,230,128,0.05)' },
  bannerTop: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm, paddingTop: Spacing.sm },
  iconBtn: { width: 34, height: 34, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 17, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  heroRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  heroInfo: { flex: 1, gap: 3 },
  heroName: { fontFamily: 'SpaceMono_400Regular', fontSize: Typography.sizes.lg, fontWeight: '900', color: Colors.ivory },
  heroHandle: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, color: Colors.gray },
  heroBio: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, color: 'rgba(255,255,255,0.6)', lineHeight: 18, marginTop: 4 },
  statsRow: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border },
  stat: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md },
  statDivider: { borderRightWidth: 1, borderRightColor: Colors.border },
  statVal: { fontFamily: 'SpaceMono_400Regular', fontSize: Typography.sizes.lg, fontWeight: '900', color: Colors.ivory },
  statLabel: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.xs, color: Colors.gray, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  editBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, paddingVertical: 11, alignItems: 'center' },
  editBtnText: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, fontWeight: '600', color: Colors.ivory },
  shareBtn: { width: 42, height: 42, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, paddingHorizontal: Spacing.base },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, position: 'relative' },
  tabText: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, color: Colors.gray },
  tabActive: { color: Colors.ivory, fontWeight: '600' },
  tabUnderline: { position: 'absolute', bottom: -1, left: '15%', right: '15%', height: 2, backgroundColor: Colors.green, borderRadius: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: Spacing.sm, gap: Spacing.sm },
  gridCard: { width: '47.5%', borderRadius: Radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  gridThumb: { height: 90, alignItems: 'center', justifyContent: 'center' },
  gridOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', paddingVertical: 4, paddingHorizontal: 8 },
  gridViews: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.xs, color: Colors.gray },
  empty: { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.sm },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { fontFamily: 'SpaceMono_400Regular', fontSize: Typography.sizes.base, color: Colors.ivory, fontWeight: '700' },
  about: { padding: Spacing.base },
  aboutText: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.base, color: 'rgba(255,255,255,0.65)', lineHeight: 22 },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: Colors.dark3, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, gap: Spacing.md },
  modalTitle: { fontFamily: 'SpaceMono_400Regular', fontSize: Typography.sizes.lg, fontWeight: '900', color: Colors.ivory, marginBottom: 4 },
  label: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.xs, color: Colors.gray, letterSpacing: 1, textTransform: 'uppercase' },
  emojiInput: { fontSize: 32, textAlign: 'center', paddingVertical: 8 },
  modalInput: { backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 10, color: Colors.ivory, fontFamily: Typography.fontBody, fontSize: Typography.sizes.base },
  bioInput: { height: 80, textAlignVertical: 'top' },
  modalBtns: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: Radius.lg, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: Colors.border },
  cancelTxt: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.base, color: Colors.gray },
  saveBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: Radius.lg, backgroundColor: Colors.green },
  saveTxt: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.base, fontWeight: '700', color: Colors.dark2 },
});
