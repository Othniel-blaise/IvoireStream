import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import StoryReel from '../../components/feed/StoryReel';
import LiveCard from '../../components/feed/LiveCard';
import { useStreamStore } from '../../store/stream.store';
import { MOCK_STORIES } from '../../constants/mock-data';

const TABS = [
  { key: 'forYou',        label: 'Pour toi' },
  { key: 'live',          label: 'En direct' },
  { key: 'subscriptions', label: 'Abonnements' },
] as const;

type TabKey = typeof TABS[number]['key'];

export default function FeedScreen() {
  const { streams, fetchStreams, isLoading } = useStreamStore();
  const [activeTab,  setActiveTab]  = useState<TabKey>('forYou');
  const [refreshing, setRefreshing] = useState(false);

  // Charge les lives réels à chaque fois qu'on revient sur cet écran
  useFocusEffect(
    useCallback(() => { fetchStreams(); }, [fetchStreams])
  );

  async function onRefresh() {
    setRefreshing(true);
    await fetchStreams();
    setRefreshing(false);
  }

  const filtered = streams.filter(s => {
    if (activeTab === 'live') return s.isLive && s.visibility === 'PUBLIC';
    return true;
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.logo}>IvoireStream</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={styles.iconBtnIcon}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={styles.iconBtnIcon}>💬</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#19E680"
            colors={['#19E680']}
          />
        }
      >
        {/* ── Stories ── */}
        <StoryReel stories={MOCK_STORIES} />

        {/* ── Tabs ── */}
        <View style={styles.tabsRow}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setActiveTab(t.key)}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
                {t.label}
              </Text>
              {activeTab === t.key && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Cards ── */}
        <View style={styles.cardList}>
          {isLoading && streams.length === 0 ? (
            <ActivityIndicator color="#19E680" style={{ marginTop: 40 }} />
          ) : filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📡</Text>
              <Text style={styles.emptyText}>
                {activeTab === 'live'
                  ? 'Aucun live en cours'
                  : 'Aucun contenu pour l\'instant'}
              </Text>
              <Text style={styles.emptyHint}>Tire vers le bas pour rafraîchir</Text>
            </View>
          ) : (
            filtered.map(stream => (
              <LiveCard key={stream.id} stream={stream} />
            ))
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0F0F14',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  logo: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 20,
    fontWeight: '900',
    color: '#19E680',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    backgroundColor: '#112119',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnIcon: {
    fontSize: 14,
  },

  // Tabs
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  tab: {
    marginRight: 20,
    paddingBottom: 10,
    position: 'relative',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#7A8A82',
  },
  tabTextActive: {
    color: '#F6F8F7',
    fontWeight: '600',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#19E680',
    borderRadius: 1,
  },

  // Cards
  cardList: {
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 14,
  },

  // Empty state
  empty: {
    alignItems: 'center',
    paddingVertical: 56,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 42,
  },
  emptyText: {
    fontFamily: 'SpaceMono_400Regular',
    fontSize: 14,
    color: '#F6F8F7',
    fontWeight: '700',
  },
  emptyHint: {
    fontSize: 12,
    color: '#7A8A82',
    fontFamily: 'SpaceMono_400Regular',
  },
});
