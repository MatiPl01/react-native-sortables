import { useHeaderHeight } from '@react-navigation/elements';
import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { Dimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBottomNavBarHeight } from '@/contexts';
import { flex, spacing, style } from '@/theme';
import { IS_IOS, IS_WEB } from '@/utils';

import type { ScrollProps } from './Scroll';
import Scroll from './Scroll';
import Spacer from './Spacer';

const WINDOW_HEIGHT = Dimensions.get('window').height;

type ScreenProps = PropsWithChildren<{
  noPadding?: boolean;
  style?: StyleProp<ViewStyle>;
  includeNavBarHeight?: boolean;
}>;

export function Screen({
  children,
  includeNavBarHeight,
  noPadding,
  style: customStyle
}: ScreenProps) {
  const bottomNavBarHeight = useBottomNavBarHeight();
  const headerHeight = useHeaderHeight();

  return (
    <View
      style={[
        flex.fill,
        IS_WEB && style.webContent,
        IS_IOS && { maxHeight: WINDOW_HEIGHT - headerHeight },
        style.visible,
        noPadding && { padding: 0 },
        customStyle
      ]}>
      {children}
      {includeNavBarHeight && <Spacer height={bottomNavBarHeight} />}
    </View>
  );
}

type ScrollScreenProps = Omit<
  ScrollProps,
  'noPadding' | 'withBottomBarSpacing'
>;

export function ScrollScreen({
  contentContainerStyle,
  includeNavBarHeight,
  ...rest
}: ScrollScreenProps) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  return (
    <Scroll
      {...rest}
      includeNavBarHeight={includeNavBarHeight}
      style={IS_IOS && { maxHeight: WINDOW_HEIGHT - headerHeight }}
      contentContainerStyle={[
        !includeNavBarHeight && { marginBottom: insets.bottom + spacing.md },
        contentContainerStyle
      ]}
      noPadding
    />
  );
}
