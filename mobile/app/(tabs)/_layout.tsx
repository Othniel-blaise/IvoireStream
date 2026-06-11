import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Gradients } from '../../constants/theme';

type TabBarProps = { state: { index: number }; navigation: { navigate: (name: string) => void } };

const TABS = [
  { name: 'index',   icon: '🏠' },
  { name: 'explore', icon: '🔍' },
  { name: 'go-live', icon: '▶', isCenter: true },
  { name: 'wallet',  icon: '💰' },
  { name: 'profile', icon: '👤' },
];

function CustomTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBar, { paddingBottom: insets.bottom + 4 }]}>
      {TABS.map((tab, idx) => {
        const focused = state.index === idx;

        if (tab.isCenter) {
          return (
            <TouchableOpacity
              key={tab.name}
              onPress={() => navigation.navigate(tab.name)}
              activeOpacity={0.85}
              style={styles.centerBtn}
            >
              <LinearGradient
                colors={Gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.centerGrad}
              >
                <Text style={styles.centerIcon}>{tab.icon}</Text>
              </LinearGradient>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={tab.name}
            onPress={() => navigation.navigate(tab.name)}
            activeOpacity={0.8}
            style={styles.tabItem}
          >
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>{tab.icon}</Text>
            {focused && <View style={styles.tabDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar state={props.state} navigation={props.navigation} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="explore" />
      <Tabs.Screen name="go-live" />
      <Tabs.Screen name="wallet" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(10,18,14,0.97)',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingBottom: 2,
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.4,
  },
  tabIconActive: {
    opacity: 1,
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.green,
  },
  centerBtn: {
    flex: 1,
    alignItems: 'center',
    marginTop: -12,
  },
  centerGrad: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerIcon: {
    fontSize: 20,
  },
});
