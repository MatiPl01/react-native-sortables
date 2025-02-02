import 'react-native';

declare module 'react-native' {
  interface ViewStyle {
    // This prop is supported on react-native-web
    contain?:
      | 'content'
      | 'layout'
      | 'none'
      | 'paint'
      | 'size'
      | 'strict'
      | 'style';
  }
}
