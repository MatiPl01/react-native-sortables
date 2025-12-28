import BrowserOnly from '@docusaurus/BrowserOnly';
import CodeBlock from '@theme/CodeBlock';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

interface Props {
  code: string;
  component: React.ComponentType;
}

export default function InteractiveExample({
  code,
  component: Component
}: Props) {
  const [key, setKey] = useState(0);
  const [splitPosition, setSplitPosition] = useState(50); // percentage for the code side
  const [isDragging, setIsDragging] = useState(false);
  const [isCodeCollapsed, setIsCodeCollapsed] = useState(true); // Default collapsed on mobile
  const [isWrapped, setIsWrapped] = useState(false); // Default unwrapped
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
    <div style={{ marginBottom: '2.5rem' }}>
      <div
        className={`interactive-example-container ${isMobile ? 'mobile-layout' : ''}`}
        ref={containerRef}
        style={{
          backgroundColor: 'var(--ifm-background-surface-color)',
          border: '1px solid var(--ifm-color-emphasis-300)',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          display: 'grid',
          // Split view styling with CSS Grid
          gridTemplateColumns: `${splitPosition}% 8px 1fr`,
          minHeight: '500px', // Fallback constraint
          overflow: 'hidden',
          position: 'relative'
        }}>
        {/* Left Side: Code */}
        <div
          className='interactive-code-section'
          style={{
            borderRight: '1px solid var(--ifm-color-emphasis-200)',
            minWidth: '300px', // Min width for code on desktop
            overflow: 'hidden',
            position: 'relative' // Critical for the height trick
          }}>
          {/* Absolute wrapper to separate height contribution */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              inset: 0,
              overflow: 'hidden',
              position: 'absolute'
            }}>
            {/* Sticky wrapper for code content to keep scrollbar visible */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                maxHeight: 'calc(100vh - var(--ifm-navbar-height))',
                position: 'sticky',
                top: 'var(--ifm-navbar-height)'
              }}>
              <div
                style={{
                  alignItems: 'center',
                  backgroundColor: 'var(--ifm-color-emphasis-100)',
                  borderBottom: '1px solid var(--ifm-color-emphasis-300)',
                  color: 'var(--ifm-color-emphasis-600)',
                  display: 'flex',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  justifyContent: 'space-between',
                  letterSpacing: '0.05em',
                  padding: '8px 16px',
                  textTransform: 'uppercase',
                  userSelect: 'none'
                }}>
                <span>Source Code</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    style={{
                      backgroundColor: isWrapped
                        ? 'var(--ifm-color-emphasis-400)' // Active state
                        : 'var(--ifm-color-emphasis-0)',
                      border: '1px solid var(--ifm-color-emphasis-400)',
                      borderRadius: '4px',
                      color: isWrapped
                        ? 'var(--ifm-color-emphasis-0)'
                        : 'var(--ifm-color-emphasis-800)',
                      cursor: 'pointer',
                      fontSize: '0.7rem',
                      padding: '2px 8px'
                    }}
                    onClick={() => setIsWrapped(!isWrapped)}>
                    {isWrapped ? 'Unwrap' : 'Wrap'}
                  </button>
                  {/* Mobile Toggle Button */}
                  <button
                    className='mobile-code-toggle'
                    style={{
                      backgroundColor: 'var(--ifm-color-emphasis-0)',
                      border: '1px solid var(--ifm-color-emphasis-400)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'none', // Hidden on desktop
                      fontSize: '0.7rem',
                      padding: '2px 8px'
                    }}
                    onClick={() => setIsCodeCollapsed(!isCodeCollapsed)}>
                    {isCodeCollapsed ? 'Show' : 'Hide'}
                  </button>
                </div>
              </div>
              <div
                className={`code-content-wrapper ${isCodeCollapsed ? 'collapsed' : ''}`}
                style={{
                  backgroundColor: 'var(--prism-background-color)',
                  display: 'flex',
                  flex: 1,
                  flexDirection: 'column',
                  margin: 0,
                  overflow: 'hidden' // Let CodeBlock handle scrolling internally if needed, or manage it here
                }}>
                <div style={{ flex: 1, overflow: 'auto' }}>
                  <CodeBlock
                    language='tsx'
                    style={{
                      borderRadius: 0,
                      fontSize: '0.85rem',
                      height: 'max-content', // Allow it to grow with content, avoiding fixed 100% blank space
                      margin: 0,
                      minHeight: '100%',
                      overflow: 'visible', // Prevent double scrollbars
                      whiteSpace: isWrapped ? 'pre-wrap' : 'pre',
                      wordBreak: isWrapped ? 'break-word' : 'normal'
                    }}>
                    {code}
                  </CodeBlock>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resizable Divider (Desktop only) */}
        <div
          className='interactive-divider'
          title='Drag to resize'
          style={{
            alignItems: 'center',
            backgroundColor: isDragging
              ? 'var(--ifm-color-primary)'
              : 'var(--ifm-color-emphasis-200)',
            borderLeft: '1px solid var(--ifm-color-emphasis-200)',
            borderRight: '1px solid var(--ifm-color-emphasis-200)',
            cursor: 'col-resize',
            display: 'flex',
            height: '100%',
            justifyContent: 'center',
            transition: 'background-color 0.2s',
            zIndex: 10
          }}
          onMouseDown={startDragging}>
          <div
            style={{
              backgroundColor: 'var(--ifm-color-emphasis-500)',
              borderRadius: '1px',
              height: '24px',
              width: '2px'
            }}
          />
        </div>

        {/* Right Side: Demo */}
        <div
          className='interactive-demo-section'
          style={{
            backgroundColor: 'var(--ifm-color-emphasis-100)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%', // Ensure it fills the grid column
            minWidth: '320px' // Min width for device frame
          }}>
          <div
            style={{
              alignItems: 'center',
              backgroundColor: 'var(--ifm-color-emphasis-100)',
              borderBottom: '1px solid var(--ifm-color-emphasis-300)',
              color: 'var(--ifm-color-emphasis-600)',
              display: 'flex',
              fontSize: '0.75rem',
              fontWeight: 700,
              justifyContent: 'space-between',
              letterSpacing: '0.05em',
              padding: '8px 16px',
              textTransform: 'uppercase',
              userSelect: 'none'
            }}>
            <span>Interactive Demo</span>
            <button
              style={{
                backgroundColor: 'var(--ifm-color-emphasis-0)',
                border: '1px solid var(--ifm-color-emphasis-400)',
                borderRadius: '4px',
                color: 'var(--ifm-color-primary)',
                cursor: 'pointer',
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '2px 8px',
                transition: 'all 0.15s ease'
              }}
              onClick={handleReset}>
              Reset
            </button>
          </div>
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              flex: 1,
              flexDirection: 'column',
              justifyContent: 'center',
              overflow: 'hidden',
              padding: '1rem'
            }}>
            <div
              style={{
                backgroundColor: 'var(--ifm-background-surface-color)',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                height: 'auto', // Must be auto to grow with content
                maxWidth: '430px',
                minHeight: '400px', // Minimum height for empty/small demos
                minWidth: '300px',
                overflow: 'hidden',
                width: '100%'
              }}>
              <BrowserOnly
                fallback={
                  <div style={{ padding: '2rem', textAlign: 'center' }}>
                    Loading interactive demo...
                  </div>
                }>
                {() => (
                  <GestureHandlerRootView
                    style={{ flex: 1, minHeight: '400px' }}>
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

      <style
        dangerouslySetInnerHTML={{
          __html: `
        /* Mobile Layout based on Container Query (via JS class) */
        .interactive-example-container.mobile-layout {
          display: flex !important;
          flex-direction: column-reverse !important; /* Demo on top, Code below */
          height: auto !important;
        }
        
        .interactive-example-container.mobile-layout .interactive-divider {
          display: none !important;
        }
        
        .interactive-example-container.mobile-layout .interactive-code-section {
          width: 100% !important;
          min-width: 0 !important;
          border-right: none !important;
          border-top: 1px solid var(--ifm-color-emphasis-300);
          height: auto !important; /* Code grows naturally on mobile */
        }
        
        /* Remove absolute positioning on mobile */
        .interactive-example-container.mobile-layout .interactive-code-section > div {
          position: relative !important;
          inset: auto !important;
        }

        .interactive-example-container.mobile-layout .interactive-demo-section {
          width: 100% !important;
          height: auto !important; /* Demo grows naturally */
        }

        .interactive-example-container.mobile-layout .mobile-code-toggle {
          display: block !important;
        }

        .interactive-example-container.mobile-layout .code-content-wrapper.collapsed {
          display: none !important;
        }
        
        .interactive-example-container.mobile-layout .code-content-wrapper:not(.collapsed) {
          height: 400px !important; /* Limit height when expanded */
        }
      `
        }}
      />
    </div>
  );
}
