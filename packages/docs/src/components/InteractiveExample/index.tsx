import BrowserOnly from '@docusaurus/BrowserOnly';
import { useColorMode } from '@docusaurus/theme-common';
import CodeBlock from '@theme/CodeBlock';
import { clsx } from 'clsx';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import styles from './styles.module.css';

interface Props {
  code: string;
  component: React.ComponentType;
  metastring?: string;
}

const CopyIcon = () => (
  <svg
    fill='none'
    height='16'
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
    strokeWidth='2'
    viewBox='0 0 24 24'
    width='16'>
    <rect height='13' rx='2' ry='2' width='13' x='9' y='9' />
    <path d='M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1' />
  </svg>
);

const WrapIcon = () => (
  <svg
    fill='none'
    height='16'
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
    strokeWidth='2'
    viewBox='0 0 24 24'
    width='16'>
    <line x1='3' x2='21' y1='6' y2='6' />
    <line x1='3' x2='21' y1='12' y2='12' />
    <line x1='3' x2='15' y1='18' y2='18' />
    <polyline points='16 16 18 18 22 14' />
  </svg>
);

const CheckIcon = () => (
  <svg
    fill='none'
    height='16'
    stroke='currentColor'
    strokeLinecap='round'
    strokeLinejoin='round'
    strokeWidth='2'
    viewBox='0 0 24 24'
    width='16'>
    <polyline points='20 6 9 17 4 12' />
  </svg>
);

function colorToHex(color: string): string {
  if (color.startsWith('#')) return color;
  const match = color.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/
  );
  if (!match) return color;

  const r = parseInt(match[1], 10).toString(16).padStart(2, '0');
  const g = parseInt(match[2], 10).toString(16).padStart(2, '0');
  const b = parseInt(match[3], 10).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`.toUpperCase();
}

export default function InteractiveExample({
  code,
  component: Component,
  metastring
}: Props) {
  const { colorMode } = useColorMode();
  const [key, setKey] = useState(0);
  const [splitPosition, setSplitPosition] = useState(50); // percentage for the code side
  const [isDragging, setIsDragging] = useState(false);
  const [isCodeCollapsed, setIsCodeCollapsed] = useState(true); // Default collapsed on mobile
  const [isWrapped, setIsWrapped] = useState(false); // Default unwrapped
  const [isCopied, setIsCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [displayCode, setDisplayCode] = useState(code);

  useEffect(() => {
    const regex = /(['"])var\(--([a-zA-Z0-9-]+)\)\1/g;
    let newCode = code;
    const matches = [...code.matchAll(regex)];

    if (matches.length > 0) {
      const computedStyle = getComputedStyle(document.documentElement);
      const replacements = new Map<string, string>();

      matches.forEach(match => {
        const fullMatch = match[0];
        const quote = match[1];
        const varName = `--${match[2]}`;

        if (!replacements.has(fullMatch)) {
          const value = computedStyle.getPropertyValue(varName).trim();
          if (value) {
            replacements.set(fullMatch, `${quote}${colorToHex(value)}${quote}`);
          }
        }
      });

      replacements.forEach((val, key) => {
        newCode = newCode.split(key).join(val);
      });
    }
    setDisplayCode(newCode);
  }, [code, colorMode, key]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(displayCode).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }, [displayCode]);

  const handleReset = () => {
    setKey(prev => prev + 1);
  };

  const startDragging = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const stopDragging = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newPosition =
        ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Pixel constraints
      const minCodeWidthPx = 300;
      const minDemoWidthPx = 320;
      const minCodePercent = (minCodeWidthPx / containerRect.width) * 100;
      const maxCodePercent = 100 - (minDemoWidthPx / containerRect.width) * 100;

      if (newPosition >= minCodePercent && newPosition <= maxCodePercent) {
        setSplitPosition(newPosition);
      }
    },
    [isDragging]
  );

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', stopDragging);
    } else {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopDragging);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopDragging);
    };
  }, [isDragging, onMouseMove, stopDragging]);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        // Safe resizing: if container is narrower than 750px, switch to mobile stack
        setIsMobile(entry.contentRect.width < 750 || window.innerWidth < 996);
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className={styles.wrapper}>
      <div
        className={clsx(styles.container, isMobile && styles.mobileLayout)}
        ref={containerRef}
        style={{
          // Split view styling with CSS Grid (stays inline as it's dynamic)
          gridTemplateColumns: isMobile
            ? undefined
            : `${splitPosition}% 8px 1fr`
        }}>
        {/* Left Side: Code */}
        <div className={styles.codeSection}>
          {/* Absolute wrapper to separate height contribution */}
          <div className={styles.codeAbsoluteWrapper}>
            {/* Sticky wrapper for code content to keep scrollbar visible */}
            <div className={styles.codeStickyWrapper}>
              <div className={styles.header}>
                <span>Source Code</span>
                <div className={styles.headerActions}>
                  <button
                    title={isWrapped ? 'Unwrap code' : 'Wrap code'}
                    className={clsx(
                      styles.iconButton,
                      isWrapped && styles.active
                    )}
                    onClick={() => setIsWrapped(!isWrapped)}>
                    <WrapIcon />
                  </button>
                  <button
                    title='Copy code'
                    className={clsx(
                      styles.iconButton,
                      isCopied && styles.copied
                    )}
                    onClick={handleCopy}>
                    {isCopied ? <CheckIcon /> : <CopyIcon />}
                  </button>
                  {/* Mobile Toggle Button */}
                  <button
                    className={styles.mobileCodeToggle}
                    onClick={() => setIsCodeCollapsed(!isCodeCollapsed)}>
                    {isCodeCollapsed ? 'Show' : 'Hide'}
                  </button>
                </div>
              </div>
              <div
                className={clsx(
                  styles.codeContentWrapper,
                  isCodeCollapsed && styles.collapsed,
                  isWrapped && styles.codeWrapped
                )}>
                <div className={styles.codeScrollContainer}>
                  <CodeBlock
                    className={styles.codeBlockOverride}
                    language='tsx'
                    metastring={metastring}>
                    {displayCode}
                  </CodeBlock>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resizable Divider (Desktop only) */}
        <div
          className={clsx(styles.divider, isDragging && styles.dragging)}
          title='Drag to resize'
          onMouseDown={startDragging}>
          <div className={styles.dividerHandle} />
        </div>

        {/* Right Side: Demo */}
        <div className={styles.demoSection}>
          <div className={styles.header}>
            <span>Interactive Demo</span>
            <button className={styles.resetButton} onClick={handleReset}>
              Reset
            </button>
          </div>
          <div className={styles.demoContent}>
            <div className={styles.deviceFrame}>
              <BrowserOnly
                fallback={
                  <div className={styles.fallback}>
                    Loading interactive demo...
                  </div>
                }>
                {() => (
                  <GestureHandlerRootView className={styles.gestureHandlerRoot}>
                    <React.Fragment key={key}>
                      <Component />
                    </React.Fragment>
                  </GestureHandlerRootView>
                )}
              </BrowserOnly>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
