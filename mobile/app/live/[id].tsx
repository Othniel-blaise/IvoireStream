import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import { MOCK_STREAMS } from '../../constants/mock-data';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import type { LiveStream, Comment } from '../../types';

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function LiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const stream: LiveStream = MOCK_STREAMS.find(s => s.id === id) ?? MOCK_STREAMS[0];
  const isPrivate = stream.visibility === 'private';

  const [unlocked,  setUnlocked]  = useState(!isPrivate);
  const [message,   setMessage]   = useState('');
  const [comments,  setComments]  = useState<Comment[]>(stream.comments);
  const [elapsed,   setElapsed]   = useState(Date.now() - stream.startedAt.getTime());
  const [following, setFollowing] = useState(stream.host.isFollowing ?? false);

  const listRef = useRef<FlatList<Comment>>(null);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Date.now() - stream.startedAt.getTime()), 1000);
    return () => clearInterval(t);
  }, [stream.startedAt]);

  function sendMessage() {
    if (!message.trim()) return;
    const newCmt: Comment = {
      id: String(Date.now()),
      author: { id: 'me', username: 'Toi', avatarEmoji: '👤' },
      text: message.trim(),
      sentAt: new Date(),
    };
    setComments(prev => [...prev, newCmt]);
    setMessage('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
  }

  // ── Private gate ────────────────────────────────────────────────────
  if (!unlocked) {
    return (
      <View style={styles.gate}>
        {/* Background */}
        <LinearGradient colors={['#060D09', '#100F1F']} style={StyleSheet.absoluteFill} />
        <View style={styles.gateBgEmoji}>
          <Text style={styles.gateBgText}>{stream.emoji}</Text>
        </View>
        <LinearGradient
          colors={['rgba(6,13,9,0.7)', 'rgba(16,15,31,0.9)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Close */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.closeBtn, { top: insets.top + 12, right: 16 }]}
        >
          <Text style={styles.closeTxt}>✕</Text>
        </TouchableOpacity>

        <View style={styles.gateContent}>
          <Avatar
            emoji={stream.host.avatarEmoji}
            size={72}
            ring="orange"
            verified={stream.host.isVerified}
          />
          <Text style={styles.gateName}>{stream.host.username}</Text>
          <View style={styles.gateStatusRow}>
            <View style={styles.gateStatusDot} />
            <Text style={styles.gateStatusTxt}>En live privé maintenant</Text>
          </View>

          {/* Price box */}
          <View style={styles.priceBox}>
            <LinearGradient
              colors={['rgba(255,209,102,0.08)', 'rgba(255,140,0,0.08)']}
              style={[StyleSheet.absoluteFill, { borderRadius: Radius.xl }]}
            />
            <Text style={styles.priceLabel}>ACCÈS EXCLUSIF</Text>
            <Text style={styles.priceVal}>{stream.priceXOF?.toLocaleString()} FCFA</Text>
            <Text style={styles.priceSub}>fixé par le créateur</Text>
          </View>

          {/* Wave CTA */}
          <TouchableOpacity
            onPress={() => setUnlocked(true)}
            activeOpacity={0.88}
            style={styles.waveWrap}
          >
            <LinearGradient
              colors={[Colors.gold, Colors.orange]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.waveBtn}
            >
              <Text style={styles.waveText}>📲  Payer via WAVE</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.gateNote}>🔒 Paiement sécurisé · Accès immédiat</Text>
        </View>
      </View>
    );
  }

  // ── Live view ────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Stream background */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#061209', '#0A1E14', '#141400']}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.streamBg}>{stream.emoji}</Text>
        {/* Vignette: bottom fade to black */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          style={styles.vignette}
        />
      </View>

      {/* ── Top bar ── */}
      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        {/* Host pill */}
        <View style={styles.hostPill}>
          <Avatar emoji={stream.host.avatarEmoji} size={30} ring="green" />
          <View style={styles.hostInfo}>
            <Text style={styles.hostName} numberOfLines={1}>{stream.host.username}</Text>
            <Text style={styles.viewerCount}>👁 {stream.viewerCount.toLocaleString()}</Text>
          </View>
          <TouchableOpacity
            onPress={() => setFollowing(v => !v)}
            style={[styles.followBtn, following && styles.followingBtn]}
          >
            <Text style={[styles.followTxt, following && styles.followingTxt]}>
              {following ? '✓ Abonné' : 'Suivre'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Right controls */}
        <View style={styles.topRight}>
          <Text style={styles.timer}>{formatDuration(elapsed)}</Text>
          <Badge label="LIVE" variant="live" pulse />
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Text style={styles.closeTxt}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Gift notifications (right side) ── */}
      {stream.gifts.length > 0 && (
        <View style={styles.giftsPanel}>
          {stream.gifts.map(gift => (
            <View key={gift.id} style={styles.giftPill}>
              <Text style={{ fontSize: 16 }}>{gift.emoji}</Text>
              <Text style={styles.giftText}>{gift.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Bottom: comments + input ── */}
      <View style={[styles.bottom, { paddingBottom: insets.bottom + 8 }]}>
        <FlatList
          ref={listRef}
          data={comments.slice(-8)}
          keyExtractor={c => c.id}
          scrollEnabled={false}
          contentContainerStyle={styles.cmtList}
          renderItem={({ item: cmt }) => (
            <View style={styles.comment}>
              <View style={styles.cmtAvatar}>
                <Text style={{ fontSize: 11 }}>{cmt.author.avatarEmoji}</Text>
              </View>
              <View style={styles.cmtBubble}>
                <Text style={styles.cmtText} numberOfLines={2}>
                  <Text style={styles.cmtAuthor}>{cmt.author.username}  </Text>
                  {cmt.text}
                </Text>
              </View>
            </View>
          )}
        />

        {/* Input row */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Écrire un message..."
            placeholderTextColor="rgba(255,255,255,0.35)"
            value={message}
            onChangeText={setMessage}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity style={styles.giftFab} onPress={() => {}}>
            <LinearGradient
              colors={[Colors.gold, Colors.orange]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabGrad}
            >
              <Text style={{ fontSize: 15 }}>🎁</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareFab} onPress={() => {}}>
            <Text style={styles.shareIcon}>↗</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({

  // ── Shared ───────────────────────────────────────────────────────────
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeTxt: {
    color: Colors.ivory,
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Private gate ─────────────────────────────────────────────────────
  gate: {
    flex: 1,
    backgroundColor: '#060D09',
  },
  gateBgEmoji: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gateBgText: {
    fontSize: 120,
    opacity: 0.15,
  },
  gateContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'],
    gap: Spacing.md,
  },
  gateName: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: Typography.sizes.xl,
    fontWeight: '900',
    color: Colors.ivory,
    textAlign: 'center',
  },
  gateStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gateStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.gold,
  },
  gateStatusTxt: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.sm,
    color: 'rgba(255,255,255,0.5)',
  },
  priceBox: {
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,209,102,0.3)',
    borderRadius: Radius.xl,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing['2xl'],
    alignItems: 'center',
    overflow: 'hidden',
    marginTop: 4,
  },
  priceLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: Typography.sizes.xs,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 2,
    marginBottom: 6,
  },
  priceVal: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: Typography.sizes['3xl'],
    fontWeight: '900',
    color: Colors.gold,
  },
  priceSub: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.xs,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 4,
  },
  waveWrap: { width: '100%', marginTop: 4 },
  waveBtn: {
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  waveText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: Typography.sizes.base,
    fontWeight: '900',
    color: Colors.dark2,
    letterSpacing: 0.3,
  },
  gateNote: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.xs,
    color: 'rgba(255,255,255,0.22)',
    textAlign: 'center',
  },

  // ── Live view ────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  streamBg: {
    position: 'absolute',
    fontSize: 110,
    alignSelf: 'center',
    top: '28%',
    opacity: 0.35,
  },
  vignette: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%',
  },

  topBar: {
    position: 'absolute',
    left: Spacing.base,
    right: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    zIndex: 10,
  },
  hostPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.52)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  hostInfo: { flex: 1 },
  hostName: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.ivory,
  },
  viewerCount: {
    fontFamily: Typography.fontBody,
    fontSize: 9,
    color: 'rgba(255,255,255,0.55)',
  },
  followBtn: {
    backgroundColor: Colors.green,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  followingBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  followTxt: {
    fontFamily: Typography.fontBody,
    fontSize: 10,
    fontWeight: '700',
    color: Colors.dark2,
  },
  followingTxt: {
    color: 'rgba(255,255,255,0.5)',
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timer: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },

  // Gift notifications
  giftsPanel: {
    position: 'absolute',
    right: Spacing.base,
    bottom: 160,
    gap: 6,
    alignItems: 'flex-end',
    zIndex: 5,
  },
  giftPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255,209,102,0.3)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
  },
  giftText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.xs,
    color: Colors.gold,
    fontWeight: '600',
  },

  // Comments + input
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  cmtList: { gap: 5 },
  comment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cmtAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cmtBubble: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    flexShrink: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cmtText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.xs,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 16,
  },
  cmtAuthor: {
    color: Colors.green,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    color: Colors.ivory,
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.sm,
  },
  giftFab: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
  },
  fabGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareFab: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIcon: {
    color: Colors.ivory,
    fontSize: 15,
    fontWeight: '700',
  },
});
