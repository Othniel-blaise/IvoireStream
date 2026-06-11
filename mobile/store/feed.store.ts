import { create } from 'zustand';
import type { FeedState, LiveStream, Story } from '../types';
import { MOCK_STREAMS, MOCK_STORIES } from '../constants/mock-data';

interface FeedStore extends FeedState {
  setTab: (tab: FeedState['activeTab']) => void;
  setStreams: (streams: LiveStream[]) => void;
  setStories: (stories: Story[]) => void;
}

export const useFeedStore = create<FeedStore>((set) => ({
  activeTab: 'forYou',
  streams: MOCK_STREAMS,
  stories: MOCK_STORIES,

  setTab: (activeTab) => set({ activeTab }),
  setStreams: (streams) => set({ streams }),
  setStories: (stories) => set({ stories }),
}));
