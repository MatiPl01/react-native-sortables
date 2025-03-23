import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button, CheckBox } from '@/components';
import { useBottomNavBarSettings } from '@/providers';
import { spacing } from '@/theme';

type BottomNavBarSettingsProps = {
  onClose: () => void;
};

export default function BottomNavBarSettings({
  onClose
}: BottomNavBarSettingsProps) {
  const { onSettingsChange, settings } = useBottomNavBarSettings();
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  return (
    <Animated.View entering={FadeIn}>
      <View style={styles.settingsList}>
        <CheckBox
          label='Enable active item portal'
          selected={localSettings.activeItemPortalEnabled}
          onChange={selected =>
            setLocalSettings({
              ...settings,
              activeItemPortalEnabled: selected
            })
          }
        />
      </View>
      <Button
        style={styles.saveButton}
        title='Save changes'
        onPress={handleSave}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  saveButton: {
    alignSelf: 'flex-end',
    marginRight: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs
  },
  settingsList: {
    gap: spacing.xs,
    padding: spacing.sm
  }
});
