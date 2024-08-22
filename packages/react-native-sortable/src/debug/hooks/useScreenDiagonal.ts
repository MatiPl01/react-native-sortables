import { Dimensions } from 'react-native';

export default function useScreenDiagonal() {
  const { height, width } = Dimensions.get('screen');
  return Math.sqrt(width ** 2 + height ** 2);
}
