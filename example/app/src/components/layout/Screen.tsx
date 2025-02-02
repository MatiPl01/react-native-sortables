import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { flex, spacing, style } from '@/theme';
import { IS_WEB } from '@/utils';

import type { ScrollProps } from './Scroll';
import Scroll from './Scroll';

type ScreenProps = PropsWithChildren<{
  noPadding?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

export function Screen({
  children,
  noPadding,
  style: customStyle
}: ScreenProps) {
  return (
    <View
      style={[
        flex.fill,
        style.contentContainer,
        IS_WEB && style.webContent,
        style.visible,
        noPadding && { padding: 0 },
        customStyle
      ]}>
      {children}
    </View>
  );
}

type ScrollScreenProps = Omit<
  ScrollProps,
  'noPadding' | 'withBottomBarSpacing'
>;

export function ScrollScreen({
  contentContainerStyle,
  ...rest
}: ScrollScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <Scroll
      {...rest}
      contentContainerStyle={[
        { paddingBottom: insets.bottom + spacing.md },
        contentContainerStyle
      ]}
      noPadding
    />
  );
}
