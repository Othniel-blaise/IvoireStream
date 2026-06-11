import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useWalletStore } from '../../store/wallet.store';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { formatXOF, formatCount } from '../../constants/mock-data';
import type { Transaction } from '../../types';

const TX_ICON_BG: Record<Transaction['type'], string> = {
  gift_received: 'rgba(255,209,102,0.14)',
  private_live:  'rgba(168,85,247,0.14)',
  withdrawal:    'rgba(25,230,128,0.12)',
};

const TX_AMOUNT_COLOR: Record<Transaction['type'], string> = {
  gift_received: Colors.gold,
  private_live:  '#A855F7',
  withdrawal:    Colors.red,
};

export default function WalletScreen() {
  const { wallet } = useWalletStore();
  const month = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Portefeuille</Text>
          <Text style={styles.headerPeriod}>{month}</Text>
        </View>
        <TouchableOpacity style={styles.settingsBtn}>
          <Text style={{ fontSize: 14 }}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >

        {/* ── Balance card ── */}
        <View style={styles.balanceCard}>
          {/* Background gradient */}
          <LinearGradient
            colors={[Colors.dark3, '#0C1E14', Colors.dark2]}
            style={[StyleSheet.absoluteFill, { borderRadius: 22 }]}
          />
          {/* Glow orbs */}
          <View style={styles.glowOrb1} />
          <View style={styles.glowOrb2} />

          <Text style={styles.balanceLabel}>SOLDE TOTAL</Text>
          <Text style={styles.balanceAmount}>{formatXOF(wallet.balanceXOF)}</Text>

          <View style={styles.trendRow}>
            <View style={styles.trendChip}>
              <Text style={styles.trendPct}>▲ +{wallet.trendPercent}%</Text>
            </View>
            <Text style={styles.trendDesc}>vs mois dernier</Text>
          </View>

          {/* Withdraw button (bottom-right) */}
          <TouchableOpacity style={styles.withdrawBtn}>
            <LinearGradient
              colors={[Colors.green, Colors.green2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.withdrawGrad}
            >
              <Text style={styles.withdrawText}>Retirer →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Mini stats ── */}
        <View style={styles.statsRow}>
          {[
            { val: String(wallet.livesCount),           label: 'Lives',   color: Colors.gold   },
            { val: String(wallet.privateLivesCount),     label: 'Privés',  color: '#A855F7'     },
            { val: formatCount(wallet.totalViewers),     label: 'Viewers', color: Colors.green  },
          ].map((s, i) => (
            <View key={i} style={styles.statCard}>
              <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Transactions ── */}
        <View style={styles.txSection}>
          <Text style={styles.txSectionTitle}>TRANSACTIONS</Text>
          <View style={styles.txList}>
            {wallet.transactions.map((tx: Transaction) => (
              <View key={tx.id} style={styles.txItem}>
                {/* Icon */}
                <View style={[styles.txIconWrap, { backgroundColor: TX_ICON_BG[tx.type] }]}>
                  <Text style={{ fontSize: 18 }}>{tx.emoji}</Text>
                </View>

                {/* Label + date */}
                <View style={styles.txInfo}>
                  <Text style={styles.txName}>{tx.label}</Text>
                  <Text style={styles.txDate}>
                    {tx.date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </Text>
                </View>

                {/* Amount */}
                <Text style={[styles.txAmount, { color: TX_AMOUNT_COLOR[tx.type] }]}>
                  {tx.amountXOF > 0 ? '+' : ''}{formatXOF(tx.amountXOF)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.dark },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  headerTitle: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: Typography.sizes.xl,
    fontWeight: '900',
    color: Colors.ivory,
  },
  headerPeriod: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.xs,
    color: Colors.gray,
    marginTop: 2,
  },
  settingsBtn: {
    width: 34,
    height: 34,
    backgroundColor: Colors.dark3,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    gap: Spacing.md,
  },

  // Balance card
  balanceCard: {
    borderRadius: 22,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(25,230,128,0.18)',
    overflow: 'hidden',
    minHeight: 150,
  },
  glowOrb1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(25,230,128,0.06)',
  },
  glowOrb2: {
    position: 'absolute',
    bottom: -20,
    left: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,192,96,0.04)',
  },
  balanceLabel: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: Typography.sizes.xs,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 2,
    marginBottom: 6,
  },
  balanceAmount: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: Typography.sizes['3xl'],
    fontWeight: '900',
    color: Colors.ivory,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 10,
  },
  trendChip: {
    backgroundColor: 'rgba(25,230,128,0.15)',
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  trendPct: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: Typography.sizes.xs,
    color: Colors.green,
    fontWeight: '700',
  },
  trendDesc: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.xs,
    color: 'rgba(255,255,255,0.35)',
  },
  withdrawBtn: {
    position: 'absolute',
    right: Spacing.md,
    bottom: Spacing.md,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  withdrawGrad: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radius.md,
  },
  withdrawText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: Typography.sizes.xs,
    fontWeight: '700',
    color: Colors.dark2,
  },

  // Mini stats
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.dark3,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statVal: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: Typography.sizes.xl,
    fontWeight: '900',
  },
  statLabel: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.xs,
    color: Colors.gray,
    marginTop: 2,
  },

  // Transactions
  txSection: { gap: Spacing.sm },
  txSectionTitle: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: Typography.sizes.xs,
    color: Colors.gray,
    letterSpacing: 1.5,
  },
  txList: {
    backgroundColor: Colors.dark3,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  txIconWrap: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: { flex: 1 },
  txName: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.sm,
    fontWeight: '600',
    color: Colors.ivory,
  },
  txDate: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.xs,
    color: Colors.gray,
    marginTop: 2,
  },
  txAmount: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
  },
});
