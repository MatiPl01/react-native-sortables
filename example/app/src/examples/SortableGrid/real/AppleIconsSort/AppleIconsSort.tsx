import { memo, useCallback, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
  FadeIn,
  FadeOut,
  useDerivedValue
} from 'react-native-reanimated';
import type { SortableGridRenderItem } from 'react-native-sortables';
import Sortable from 'react-native-sortables';

import amazon from './img/amazon.png';
import dropbox from './img/dropbox.png';
import facebook from './img/facebook.png';
import github from './img/github.png';
import gmail from './img/gmail.png';
import google from './img/google.png';
import googleDrive from './img/google-drive.png';
import instagram from './img/instagram.png';
import linkedin from './img/linkedin.png';
import messenger from './img/messenger.png';
import paypal from './img/paypal.png';
import pinterest from './img/pinterest.png';
import reddit from './img/reddit.png';
import skype from './img/skype.png';
import spotify from './img/spotify.png';
import telegram from './img/telegram.png';
import twitter from './img/twitter.png';
import whatsapp from './img/whatsapp.png';
import youtube from './img/youtube.png';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type IconData = {
  image: ImageSourcePropType;
  label: string;
};

const ICONS: Array<IconData> = [
  { image: amazon, label: 'Amazon' },
  { image: dropbox, label: 'Dropbox' },
  { image: facebook, label: 'Facebook' },
  { image: gmail, label: 'Gmail' },
  { image: github, label: 'GitHub' },
  { image: google, label: 'Google' },
  { image: googleDrive, label: 'Drive' },
  { image: instagram, label: 'Instagram' },
  { image: linkedin, label: 'LinkedIn' },
  { image: messenger, label: 'Messenger' },
  { image: paypal, label: 'PayPal' },
  { image: pinterest, label: 'Pinterest' },
  { image: reddit, label: 'Reddit' },
  { image: skype, label: 'Skype' },
  { image: spotify, label: 'Spotify' },
  { image: telegram, label: 'Telegram' },
  { image: twitter, label: 'Twitter' },
  { image: whatsapp, label: 'WhatsApp' },
  { image: youtube, label: 'YouTube' }
];

const keyExtractor = (item: IconData) => item.label;

type IconProps = {
  item: IconData;
  isEditing: SharedValue<boolean>;
};

const Icon = memo(function Icon({ isEditing, item }: IconProps) {
  // const shakeProgress = useDerivedValue(() =>
  //   isEditing.value
  //     ? withDelay(
  //         Math.random() * 300,
  //         withRepeat(
  //           withSequence(
  //             withTiming(-2, {
  //               duration: 150,
  //               easing: Easing.inOut(Easing.ease)
  //             }),
  //             withTiming(2, {
  //               duration: 150,
  //               easing: Easing.inOut(Easing.ease)
  //             })
  //           ),
  //           -1
  //         )
  //       )
  //     : withTiming(0)
  // );

  // const animatedStyle = useAnimatedStyle(() => ({
  //   transform: [{ rotate: `${shakeProgress.value}deg` }]
  // }));

  return (
    <Animated.View style={[styles.icon]}>
      <View style={styles.imageContainer}>
        <Image source={item.image} style={styles.image} />
      </View>
      <Text style={styles.text}>{item.label}</Text>
    </Animated.View>
  );
});

export default function AppleIconsSort() {
  const [icons, setIcons] = useState(ICONS);
  const [isEditing, setIsEditing] = useState(false);
  const isEditingValue = useDerivedValue(() => isEditing);

  const renderItem = useCallback<SortableGridRenderItem<IconData>>(
    ({ item }) => <Icon isEditing={isEditingValue} item={item} />,
    [isEditingValue]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {isEditing && (
          <AnimatedPressable
            entering={FadeIn}
            exiting={FadeOut}
            style={styles.button}
            onPress={() => setIsEditing(false)}>
            <Text style={styles.buttonText}>Done</Text>
          </AnimatedPressable>
        )}
      </View>
      <Sortable.Grid
        columnGap={24}
        columns={4}
        data={icons}
        inactiveItemOpacity={1}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        rowGap={24}
        onDragEnd={({ data }) => {
          setIcons(data);
        }}
        onDragStart={() => {
          setIsEditing(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  buttonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold'
  },
  container: {
    // eslint-disable-next-line camelcase
    experimental_backgroundImage: `linear-gradient(125deg, #0a3d62 0%, #1e8449 50%, #0a3d62 100%), 
      linear-gradient(45deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%), 
      radial-gradient(circle at 50% 50%, rgba(46, 204, 113, 0.08) 0%, rgba(46, 204, 113, 0) 70%)`,
    flex: 1,
    padding: 30
  },
  header: {
    alignItems: 'flex-end',
    height: 40,
    justifyContent: 'center',
    marginBottom: 16
  },
  icon: {
    backgroundColor: 'blue',
    gap: 8
  },
  image: {
    resizeMode: 'contain',
    width: '100%'
  },
  imageContainer: {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: 'white',
    borderCurve: 'continuous',
    borderRadius: '30%',
    justifyContent: 'center',
    padding: 8
  },
  text: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 5
  }
});
