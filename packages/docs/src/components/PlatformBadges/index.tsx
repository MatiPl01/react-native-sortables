import { clsx } from 'clsx';
import { type PropsWithChildren, useMemo } from 'react';

import styles from './styles.module.css';

export type Platform = 'android' | 'ios' | 'web';

type PlatformBadgeProps = PropsWithChildren<{
  platform: Platform;
}>;

function PlatformBadge({ children, platform }: PlatformBadgeProps) {
  const platformInfo = useMemo(() => {
    switch (platform) {
      case 'android':
        return {
          className: styles.android,
          color: '#3DDC84',
          label: 'Android'
        };
      case 'ios':
        return {
          className: styles.ios,
          color: '#007AFF',
          label: 'iOS'
        };
      case 'web':
        return {
          className: styles.web,
          color: '#FF6B35',
          label: 'Web'
        };
    }
  }, [platform]);

  return (
    <span className={clsx(styles.badge, platformInfo?.className)}>
      {children ?? platformInfo.label}
    </span>
  );
}

function PlatformBadges({ platforms }: { platforms: Array<Platform> }) {
  return (
    <div className={styles.badgeContainer}>
      {platforms.map(platform => (
        <PlatformBadge key={platform} platform={platform} />
      ))}
    </div>
  );
}

export default PlatformBadges;
