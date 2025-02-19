import type { ViewStyle } from 'react-native';

import { MAX_CONTENT_WIDTH } from '@/constants';

const webContent: ViewStyle = {
  marginHorizontal: 'auto',
  maxWidth: MAX_CONTENT_WIDTH,
  width: '100%'
};

export const style = {
  visible: {
    overflow: 'visible'
  },
  webContent
} satisfies Record<string, ViewStyle>;
