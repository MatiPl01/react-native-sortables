import type { PropsWithChildren } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { View } from 'react-native';

import { flex, style } from '@/theme';
import { IS_WEB } from '@/utils';

import type { ScrollProps } from './Scroll';
import Scroll from './Scroll';

type ScreenProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
}>;

export function Screen({ children, style: customStyle }: ScreenProps) {
  return (
    <View
      style={[
        flex.fill,
        IS_WEB && style.webContent,
        { overflow: 'visible' },
        customStyle
      ]}>
      {children}
    </View>
  );
}

type ScrollScreenProps = Omit<ScrollProps, 'withBottomBarSpacing'>;

export function ScrollScreen(props: ScrollScreenProps) {
  return (
    <Screen>
      <Scroll {...props} />
    </Screen>
  );
}
