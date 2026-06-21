import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { Colors, Typography, Radius, Spacing } from '../../constants/theme';
import { formatCount } from '../../constants/mock-data';
import type { ApiStream } from '../../store/stream.store';

interface Props {
  stream: ApiStream;
}

export default function LiveCard({ stream }: Props) {
  const isPrivate = stream.visibility === 'PRIVATE';

  return (
    <TouchableOpacity
      onPress={() => router.push(`/live/${stream.id}`)}
      activeOpacity={0.9}
      style={styles.card}
    >
      {/* Thumbnail */}
      <View style={styles.thumb}>
        <LinearGradient
          colors={['#0A1A12', '#1A2A18']}
          style={styles.thumbGrad}
        >
          <Text style={styles.thumbEmoji}>{stream.emoji}</Text>
        </LinearGradient>

        {/* Blurred overlay for private */}
        {isPrivate && (
          <View style={styles.privateOverlay}>
            <LinearGradient
              colors={['rgba(26,10,46,0.85)', 'rgba(10,26,16,0.85)']}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.privateContent}>
              <Text style={styles.privateEmoji}>{stream.emoji}</Text>
              <View style={styles.priceChip}>
                <Text style={styles.priceText}>
                  {stream.priceXOF?.toLocaleString()} FCFA
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Top badges */}
        <View style={styles.topRow}>
          <Badge
            label={isPrivate ? '🔒 PRIVÉ' : 'LIVE'}
            variant={isPrivate ? 'gold' : 'live'}
            pulse={!isPrivate}
          />
          <View style={styles.viewers}>
            <Text style={styles.viewerIcon}>👁</Text>
            <Text style={styles.viewerCount}>{formatCount(stream.viewerCount)}</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Avatar emoji={stream.host.avatarEmoji} size={34} ring={isPrivate ? 'orange' : 'green'} />
        <View style={styles.meta}>
          <Text style={styles.hostName} numberOfLines={1}>{stream.host.username}</Text>
          <Text style={styles.title} numberOfLines={1}>{stream.title}</Text>
        </View>
        {isPrivate && (
          <LinearGradient colors={[Colors.gold, Colors.orange]} style={styles.joinBtn}>
            <Text style={styles.joinText}>Rejoindre</Text>
          </LinearGradient>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumb: {
    height: 160,
    position: 'relative',
  },
  thumbGrad: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbEmoji: {
    fontSize: 52,
  },
  privateOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privateContent: {
    alignItems: 'center',
    gap: 10,
  },
  privateEmoji: {
    fontSize: 36,
    opacity: 0.7,
  },
  priceChip: {
    backgroundColor: 'rgba(255,209,102,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255,209,102,0.4)',
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  priceText: {
    fontFamily: Typography.fontMono,
    fontSize: Typography.sizes.sm,
    color: Colors.gold,
    fontWeight: '700',
  },
  topRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewers: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  viewerIcon: { fontSize: 10 },
  viewerCount: {
    fontFamily: Typography.fontMono,
    fontSize: 10,
    color: Colors.ivory,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  meta: { flex: 1 },
  hostName: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.ivory,
  },
  title: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.xs,
    color: Colors.gray,
    marginTop: 1,
  },
  joinBtn: {
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  joinText: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    color: Colors.dark2,
  },
});
