import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, FlatList, KeyboardAvoidingView,
  Platform, PermissionsAndroid, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  createAgoraRtcEngine,
  IRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  RtcSurfaceView,
  VideoSourceType,
} from 'react-native-agora';
import { apiDelete } from '../../lib/api';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useStreamStore, ApiStream } from '../../store/stream.store';
import { useAuthStore } from '../../store/auth.store';
import { apiGet, apiPost } from '../../lib/api';
import { formatCount } from '../../constants/mock-data';
import { WS_URL } from '../../constants/api';

// ── Types ──────────────────────────────────────────────────────────────
interface Comment {
  id:     string;
  author: { id: string; username: string; avatarEmoji: string };
  text:   string;
  sentAt: Date;
}

function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

async function requestAndroidPermissions() {
  if (Platform.OS !== 'android') return;
  await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.CAMERA,
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
  ]);
}

// ── Composant principal ────────────────────────────────────────────────
export default function LiveScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const insets   = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { hostSession, endLive } = useStreamStore();

  // L'utilisateur est hôte si une session hôte active correspond à cet id
  const isHost      = hostSession?.stream.id === id;
  const sessionData = isHost ? hostSession : null;

  // ── State ────────────────────────────────────────────────────────────
  const [stream,         setStream]         = useState<ApiStream | null>(sessionData?.stream ?? null);
  const [unlocked,       setUnlocked]       = useState(true);
  const [message,        setMessage]        = useState('');
  const [comments,       setComments]       = useState<Comment[]>([]);
  const [elapsed,        setElapsed]        = useState(0);
  const [remoteUid,      setRemoteUid]      = useState<number | null>(null);
  const [engineReady,    setEngineReady]    = useState(false);
  const [loadingStream,  setLoadingStream]  = useState(!isHost);
  const [isFollowingHost, setIsFollowingHost] = useState(false);
  const [followPending,   setFollowPending]   = useState(false);
  const [viewerCount,    setViewerCount]    = useState<number>(sessionData?.stream?.viewerCount ?? 0);

  const engineRef        = useRef<IRtcEngine | null>(null);
  const listRef          = useRef<FlatList<Comment>>(null);
  const wsRef            = useRef<WebSocket | null>(null);
  const endedManuallyRef = useRef(false);  // true si l'hôte a appuyé "Terminer"
  const hasSeenHostRef   = useRef(false);  // true dès que le broadcaster a rejoint
  const viewerJoinedRef  = useRef(false);  // true si on a appelé /view (pour unview au départ)

  // ── Chronomètre ──────────────────────────────────────────────────────
  useEffect(() => {
    const start = stream ? new Date(stream.startedAt).getTime() : Date.now();
    const t = setInterval(() => setElapsed(Date.now() - start), 1000);
    return () => clearInterval(t);
  }, [stream?.startedAt]);

  // ── Charger le stream (viewer) ────────────────────────────────────────
  useEffect(() => {
    if (isHost) return;
    (async () => {
      const res = await apiGet<{
        stream:      ApiStream;
        channelName: string;
        agoraToken:  string;
        appId:       string;
      }>(`/api/streams/${id}`);

      if (!res.success || !res.data) {
        Alert.alert('Erreur', res.error ?? 'Stream introuvable');
        router.back();
        return;
      }

      const { stream: s } = res.data;
      setStream(s);
      setViewerCount(s.viewerCount);
      if (s.visibility === 'PRIVATE') setUnlocked(false);
      setLoadingStream(false);

      // Vérifie si le viewer suit déjà l'hôte
      const hostRes = await apiGet<{ user: { isFollowing?: boolean } }>(`/api/users/${s.hostId}`);
      if (hostRes.success && hostRes.data) {
        setIsFollowingHost(hostRes.data.user.isFollowing ?? false);
      }

      // N'incrémenter que si le live est public (privé = gate d'abord, comptage après paiement)
      if (s.visibility !== 'PRIVATE') {
        const viewRes = await apiPost<{ viewerCount: number }>(`/api/streams/${id}/view`);
        if (viewRes.success && viewRes.data) {
          setViewerCount(viewRes.data.viewerCount);
        }
        viewerJoinedRef.current = true;
      }

      // Initialiser Agora en mode viewer
      await initAgora(res.data.appId, res.data.agoraToken, res.data.channelName, false);
    })();
  }, [id]);

  // ── Initialiser Agora (hôte) ──────────────────────────────────────────
  useEffect(() => {
    if (!isHost || !sessionData) return;
    (async () => {
      await requestAndroidPermissions();
      await initAgora(sessionData.appId, sessionData.agoraToken, sessionData.channelName, true);
    })();
  }, [isHost]);

  // ── Moteur Agora ──────────────────────────────────────────────────────
  async function initAgora(appId: string, token: string, channelName: string, asHost: boolean) {
    const engine = createAgoraRtcEngine();
    engineRef.current = engine;

    engine.initialize({ appId });
    engine.setChannelProfile(ChannelProfileType.ChannelProfileLiveBroadcasting);
    engine.setClientRole(
      asHost ? ClientRoleType.ClientRoleBroadcaster : ClientRoleType.ClientRoleAudience
    );
    engine.enableVideo();

    if (asHost) engine.startPreview();

    engine.addListener('onUserJoined', (_conn, uid) => {
      hasSeenHostRef.current = true;
      setRemoteUid(uid);
    });
    engine.addListener('onUserOffline', (_conn, _uid) => setRemoteUid(null));
    engine.addListener('onError', (err) => console.warn('[Agora] error:', err));

    engine.joinChannel(token, channelName, 0, {
      publishMicrophoneTrack: asHost,
      publishCameraTrack:     asHost,
      autoSubscribeAudio:     !asHost,
      autoSubscribeVideo:     !asHost,
    });

    setEngineReady(true);
  }

  // ── Chat WebSocket (hôte + viewer) avec reconnexion automatique ──────
  useEffect(() => {
    if (loadingStream) return;
    let destroyed = false;
    let retryDelay = 1000;

    function connect() {
      if (destroyed) return;
      const ws = new WebSocket(`${WS_URL}/api/chat/${id}`);
      wsRef.current = ws;

      ws.onmessage = (e) => {
        try {
          const cmt: Comment = JSON.parse(e.data);
          setComments(prev => [...prev, { ...cmt, sentAt: new Date(cmt.sentAt) }]);
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
        } catch {}
      };

      ws.onopen  = () => { retryDelay = 1000; }; // reset backoff à la reconnexion
      ws.onerror = () => {};
      ws.onclose = () => {
        wsRef.current = null;
        if (!destroyed) {
          // Reconnexion exponentielle (max 30s)
          setTimeout(connect, Math.min(retryDelay, 30000));
          retryDelay = Math.min(retryDelay * 2, 30000);
        }
      };
    }

    connect();
    return () => {
      destroyed = true;
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [id, loadingStream]);

  // ── Refresh token Agora avant expiration (2h TTL → refresh à 1h50) ──
  useEffect(() => {
    if (!engineReady) return;
    const REFRESH_MS = 110 * 60 * 1000; // 1h50
    const timer = setTimeout(async () => {
      const res = await apiGet<{ agoraToken: string }>(`/api/streams/${id}/token`);
      if (res.success && res.data) {
        engineRef.current?.renewToken(res.data.agoraToken);
      }
    }, REFRESH_MS);
    return () => clearTimeout(timer);
  }, [id, engineReady]);

  // ── Polling du compteur de viewers (hôte + viewer) ───────────────────
  useEffect(() => {
    if (loadingStream) return;
    let active = true;
    const interval = setInterval(async () => {
      const res = await apiGet<{ viewerCount: number }>(`/api/streams/${id}/viewers`);
      if (!active) return;
      if (res.success && res.data) {
        setViewerCount(res.data.viewerCount);
      } else {
        // Live terminé ou introuvable — inutile de continuer à polluer
        clearInterval(interval);
      }
    }, 8000);
    return () => { active = false; clearInterval(interval); };
  }, [id, loadingStream]);

  // ── Nettoyage ─────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      engineRef.current?.leaveChannel();
      engineRef.current?.release();
      engineRef.current = null;
      // Décrémenter le compteur si ce viewer avait rejoint
      if (viewerJoinedRef.current) {
        apiPost(`/api/streams/${id}/unview`).catch(() => {});
      }
      // Si l'hôte quitte sans appuyer "Terminer" (fermeture app, navigation),
      // on clôture le live côté serveur pour éviter les lives fantômes en DB.
      const { hostSession, endLive } = useStreamStore.getState();
      if (hostSession?.stream.id === id && !endedManuallyRef.current) {
        endLive(id as string);
      }
    };
  }, []);

  // ── Détection fin de live pour le viewer ─────────────────────────────
  useEffect(() => {
    // Ne s'active qu'une fois qu'on a vu l'hôte et qu'il disparaît
    if (isHost || !engineReady || loadingStream) return;
    if (!hasSeenHostRef.current || remoteUid !== null) return;

    // L'hôte vient de se déconnecter — on vérifie après 4s si le live est fini
    const timer = setTimeout(async () => {
      const res = await apiGet<{ stream: ApiStream }>(`/api/streams/${id}`);
      if (!res.success || !res.data?.stream.isLive) {
        Alert.alert(
          '📡 Live terminé',
          "L'hôte a terminé ce live.",
          [{
            text: 'Retour',
            onPress: () => {
              engineRef.current?.leaveChannel();
              router.back();
            },
          }],
          { cancelable: false },
        );
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [remoteUid, isHost, engineReady, loadingStream]);

  // ── Actions ───────────────────────────────────────────────────────────
  async function handleEndLive() {
    Alert.alert('Terminer le live ?', 'Tous les viewers seront déconnectés.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Terminer',
        style: 'destructive',
        onPress: async () => {
          endedManuallyRef.current = true;
          await endLive(id);
          engineRef.current?.leaveChannel();
          router.back();
        },
      },
    ]);
  }

  function handleLeave() {
    engineRef.current?.leaveChannel();
    router.back();
  }

  async function handleFollowHost() {
    if (!stream || followPending) return;
    const wasFollowing = isFollowingHost;
    setIsFollowingHost(!wasFollowing);
    setFollowPending(true);
    const res = wasFollowing
      ? await apiDelete(`/api/users/${stream.host.id}/follow`)
      : await apiPost(`/api/users/${stream.host.id}/follow`);
    if (!res.success) setIsFollowingHost(wasFollowing);
    setFollowPending(false);
  }

  function sendMessage() {
    if (!message.trim()) return;
    const cmt: Comment = {
      id:     String(Date.now()),
      author: { id: user?.id ?? 'me', username: user?.username ?? 'Toi', avatarEmoji: user?.avatarEmoji ?? '👤' },
      text:   message.trim(),
      sentAt: new Date(),
    };
    // Affichage local immédiat
    setComments(prev => [...prev, cmt]);
    setMessage('');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
    // Diffusion aux autres via WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(cmt));
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────
  if (loadingStream) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={Colors.green} size="large" />
      </View>
    );
  }

  // ── Private gate ──────────────────────────────────────────────────────
  if (!unlocked && stream) {
    return (
      <View style={styles.gate}>
        <LinearGradient colors={['#060D09', '#100F1F']} style={StyleSheet.absoluteFill} />
        <View style={styles.gateBgEmoji}>
          <Text style={styles.gateBgText}>{stream.emoji}</Text>
        </View>
        <LinearGradient
          colors={['rgba(6,13,9,0.7)', 'rgba(16,15,31,0.9)']}
          style={StyleSheet.absoluteFill}
        />
        <TouchableOpacity
          onPress={handleLeave}
          style={[styles.closeBtn, { top: insets.top + 12, right: 16, position: 'absolute' }]}
        >
          <Text style={styles.closeTxt}>✕</Text>
        </TouchableOpacity>

        <View style={styles.gateContent}>
          <Avatar emoji={stream.host.avatarEmoji} size={72} ring="orange" verified={stream.host.isVerified} />
          <Text style={styles.gateName}>{stream.host.username}</Text>
          <View style={styles.gateStatusRow}>
            <View style={styles.gateStatusDot} />
            <Text style={styles.gateStatusTxt}>En live privé maintenant</Text>
          </View>
          <View style={styles.priceBox}>
            <LinearGradient
              colors={['rgba(255,209,102,0.08)', 'rgba(255,140,0,0.08)']}
              style={[StyleSheet.absoluteFill, { borderRadius: Radius.xl }]}
            />
            <Text style={styles.priceLabel}>ACCÈS EXCLUSIF</Text>
            <Text style={styles.priceVal}>{stream.priceXOF?.toLocaleString()} FCFA</Text>
            <Text style={styles.priceSub}>fixé par le créateur</Text>
          </View>
          <TouchableOpacity onPress={async () => {
              setUnlocked(true);
              const viewRes = await apiPost<{ viewerCount: number }>(`/api/streams/${id}/view`);
              if (viewRes.success && viewRes.data) setViewerCount(viewRes.data.viewerCount);
              viewerJoinedRef.current = true;
            }} activeOpacity={0.88} style={styles.waveWrap}>
            <LinearGradient
              colors={[Colors.gold, Colors.orange]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
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

  // ── Live view ─────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Fond vidéo Agora OU gradient emoji */}
      <View style={StyleSheet.absoluteFill}>
        {engineReady && isHost ? (
          // Hôte : caméra locale
          <RtcSurfaceView
            canvas={{ uid: 0, sourceType: VideoSourceType.VideoSourceCamera }}
            style={StyleSheet.absoluteFill}
          />
        ) : engineReady && remoteUid !== null ? (
          // Viewer : vidéo distante de l'hôte
          <RtcSurfaceView
            canvas={{ uid: remoteUid }}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          // Fallback : gradient + emoji (avant connexion ou si pas de vidéo)
          <>
            <LinearGradient
              colors={['#061209', '#0A1E14', '#141400']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.streamBg}>{stream?.emoji ?? '🎤'}</Text>
          </>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.88)']}
          style={styles.vignette}
        />
      </View>

      {/* ── Top bar ── */}
      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <View style={styles.hostPill}>
          <Avatar emoji={stream?.host.avatarEmoji ?? '👤'} size={30} ring="green" />
          <View style={styles.hostInfo}>
            <Text style={styles.hostName} numberOfLines={1}>{stream?.host.username}</Text>
            <Text style={styles.viewerCount}>👁 {formatCount(viewerCount)}</Text>
          </View>
          {!isHost && (
            <TouchableOpacity
              style={[styles.followBtn, isFollowingHost && styles.followingBtn]}
              onPress={handleFollowHost}
              disabled={followPending}
              activeOpacity={0.8}
            >
              {followPending
                ? <ActivityIndicator color={isFollowingHost ? Colors.gray : Colors.dark2} size="small" />
                : <Text style={[styles.followTxt, isFollowingHost && styles.followingTxt]}>
                    {isFollowingHost ? '✓ Abonné' : 'Suivre'}
                  </Text>
              }
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.topRight}>
          <Text style={styles.timer}>{formatDuration(elapsed)}</Text>
          <Badge label="LIVE" variant="live" pulse />
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={isHost ? handleEndLive : handleLeave}
          >
            <Text style={styles.closeTxt}>{isHost ? '⏹' : '✕'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Bottom : comments + input ── */}
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
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
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
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeTxt: { color: Colors.ivory, fontSize: 13, fontWeight: '600' },

  // Gate
  gate: { flex: 1, backgroundColor: '#060D09' },
  gateBgEmoji: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  gateBgText:  { fontSize: 120, opacity: 0.15 },
  gateContent: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing['2xl'], gap: Spacing.md,
  },
  gateName: {
    fontFamily: 'SpaceMono_400Regular', fontSize: Typography.sizes.xl,
    fontWeight: '900', color: Colors.ivory, textAlign: 'center',
  },
  gateStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gateStatusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.gold },
  gateStatusTxt: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, color: 'rgba(255,255,255,0.5)' },
  priceBox: {
    width: '100%', borderWidth: 1, borderColor: 'rgba(255,209,102,0.3)',
    borderRadius: Radius.xl, paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing['2xl'], alignItems: 'center',
    overflow: 'hidden', marginTop: 4,
  },
  priceLabel: { fontFamily: 'SpaceMono_400Regular', fontSize: Typography.sizes.xs, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, marginBottom: 6 },
  priceVal:   { fontFamily: 'SpaceMono_400Regular', fontSize: Typography.sizes['3xl'], fontWeight: '900', color: Colors.gold },
  priceSub:   { fontFamily: Typography.fontBody, fontSize: Typography.sizes.xs, color: 'rgba(255,255,255,0.3)', marginTop: 4 },
  waveWrap:   { width: '100%', marginTop: 4 },
  waveBtn: {
    borderRadius: Radius.lg, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.gold, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  waveText: { fontFamily: 'SpaceMono_400Regular', fontSize: Typography.sizes.base, fontWeight: '900', color: Colors.dark2, letterSpacing: 0.3 },
  gateNote: { fontFamily: Typography.fontBody, fontSize: Typography.sizes.xs, color: 'rgba(255,255,255,0.22)', textAlign: 'center' },

  // Live
  container: { flex: 1, backgroundColor: '#000' },
  streamBg:  { position: 'absolute', fontSize: 110, alignSelf: 'center', top: '28%', opacity: 0.35 },
  vignette:  { position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%' },

  topBar: {
    position: 'absolute', left: Spacing.base, right: Spacing.base,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, zIndex: 10,
  },
  hostPill: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.52)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: Radius.full,
  },
  hostInfo:    { flex: 1 },
  hostName:    { fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm, fontWeight: '700', color: Colors.ivory },
  viewerCount: { fontFamily: Typography.fontBody, fontSize: 9, color: 'rgba(255,255,255,0.55)' },
  followBtn: {
    backgroundColor: Colors.green, borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 4, minWidth: 60, alignItems: 'center',
  },
  followingBtn: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  followTxt:    { fontFamily: Typography.fontBody, fontSize: 10, fontWeight: '700', color: Colors.dark2 },
  followingTxt: { color: 'rgba(255,255,255,0.65)' },
  topRight:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timer: {
    fontFamily: 'SpaceMono_400Regular', fontSize: 10, color: 'rgba(255,255,255,0.55)',
    backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: Radius.sm,
  },

  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: Spacing.base, gap: Spacing.sm },
  cmtList: { gap: 5 },
  comment: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  cmtAvatar: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  cmtBubble: {
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: Radius.lg,
    paddingHorizontal: Spacing.sm, paddingVertical: 5, flexShrink: 1,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  cmtText:   { fontFamily: Typography.fontBody, fontSize: Typography.sizes.xs, color: 'rgba(255,255,255,0.9)', lineHeight: 16 },
  cmtAuthor: { color: Colors.green, fontWeight: '700' },
  inputRow:  { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
  input: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.full, paddingHorizontal: Spacing.md,
    paddingVertical: 9, color: Colors.ivory,
    fontFamily: Typography.fontBody, fontSize: Typography.sizes.sm,
  },
  giftFab:  { width: 38, height: 38, borderRadius: 19, overflow: 'hidden' },
  fabGrad:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  shareFab: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  shareIcon: { color: Colors.ivory, fontSize: 15, fontWeight: '700' },
});
