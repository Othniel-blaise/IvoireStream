import React from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import { Colors, Typography, Spacing } from '../../constants/theme';
import type { Story } from '../../types';

interface Props {
  stories: Story[];
}

export default function StoryReel({ stories }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {stories.map((story) => (
        <TouchableOpacity
          key={story.id}
          style={styles.item}
          onPress={() => router.push(`/live/${story.id}`)}
          activeOpacity={0.8}
        >
          <View style={styles.avatarWrap}>
            <Avatar emoji={story.user.avatarEmoji} size={52} ring={story.ring} />
            {story.isLive && (
              <View style={styles.liveBadge}>
                {story.isPaid ? (
                  <Text style={styles.paidBadge}>💰</Text>
                ) : (
                  <Badge label="LIVE" variant="live" pulse style={styles.badge} />
                )}
              </View>
            )}
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {story.user.username.split(' ')[0]}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  item: {
    alignItems: 'center',
    gap: 5,
    width: 58,
  },
  avatarWrap: {
    position: 'relative',
  },
  liveBadge: {
    position: 'absolute',
    bottom: -4,
    left: '50%',
    transform: [{ translateX: -16 }],
  },
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  paidBadge: {
    fontSize: 10,
    backgroundColor: Colors.gold,
    borderRadius: 4,
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  name: {
    fontFamily: Typography.fontBody,
    fontSize: Typography.sizes.xs,
    color: Colors.gray,
    textAlign: 'center',
  },
});
