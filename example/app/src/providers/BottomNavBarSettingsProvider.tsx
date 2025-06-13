import { createContext, useContext, useMemo, useState } from 'react';

import { IS_REACT_19 } from '@/constants';

type BottomNavBarSettings = {
  activeItemPortalEnabled: boolean;
};

const BottomNavBarSettingsContext = createContext<null | {
  settings: BottomNavBarSettings;
  onSettingsChange: (settings: BottomNavBarSettings) => void;
}>(null);

export function useBottomNavBarSettings() {
  const value = useContext(BottomNavBarSettingsContext);

  if (!value) {
    throw new Error(
      'useBottomNavBarSettings must be used within a BottomNavBarSettingsProvider'
    );
  }

  return value;
}

export function BottomNavBarSettingsProvider({
  children
}: {
  children: React.ReactNode;
}) {
  const [settings, setSettings] = useState<BottomNavBarSettings>({
    activeItemPortalEnabled: false
  });

  const Provider = IS_REACT_19
    ? BottomNavBarSettingsContext
    : BottomNavBarSettingsContext.Provider;

  return (
    <Provider
      value={useMemo(
        () => ({
          onSettingsChange: setSettings,
          settings
        }),
        [settings, setSettings]
      )}>
      {children}
    </Provider>
  );
}
