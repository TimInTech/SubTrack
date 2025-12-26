import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import SubscriptionsScreen from '../app/subscriptions';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useFocusEffect: (callback: any) => callback(() => undefined),
}));

jest.mock('../src/hooks/useApi', () => ({
  useSubscriptions: () => ({
    subscriptions: [],
    loading: false,
    fetch: jest.fn(),
    remove: jest.fn(),
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaProvider: ({ children }: any) => children,
    SafeAreaView: ({ children }: any) => children,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, ...props }: any) => <View {...props}>{children}</View>,
  };
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    MaterialCommunityIcons: ({ name, ...props }: any) => <Text {...props}>{name}</Text>,
  };
});

describe('Subscriptions FAB', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('navigates to the add screen when pressed', () => {
    const { getByRole } = render(
      <SafeAreaProvider>
        <SubscriptionsScreen />
      </SafeAreaProvider>
    );

    const fab = getByRole('button');
    fireEvent.press(fab);
    expect(mockPush).toHaveBeenCalledWith('/subscription/add');
  });
});
