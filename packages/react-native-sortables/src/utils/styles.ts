import type { ViewStyle } from 'react-native';

export const mergeStyles = (...styles: Array<ViewStyle>): ViewStyle => {
  'worklet';
  return styles.reduce((acc, style) => {
    if (
      style.transform &&
      acc.transform &&
      typeof style.transform === 'object'
    ) {
      return {
        ...acc,
        ...style,
        transform: [...acc.transform, ...style.transform]
      } as ViewStyle;
    }

    return { ...acc, ...style };
  }, {} as ViewStyle);
};
