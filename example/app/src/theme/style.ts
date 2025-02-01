import type { ViewStyle } from 'react-native';

import { MAX_CONTENT_WIDTH } from '@/constants';
import { IS_WEB } from '@/utils';

import { spacing } from './spacing';

const webContent: ViewStyle = {
  marginHorizontal: 'auto',
  maxWidth: MAX_CONTENT_WIDTH,
  width: '100%'
};

export const style = {
  contentContainer: {
    paddingBottom: spacing.xl,
    ...(IS_WEB && webContent)
  },
  webContent
} satisfies Record<string, ViewStyle>;
