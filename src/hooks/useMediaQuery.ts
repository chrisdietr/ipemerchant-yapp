import { useState, useEffect } from 'react';

/**
 * Hook that returns true if the window matches the given media query
 * @param query The media query to match
 * @returns A boolean indicating whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Default to false on server or during initial client render
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia(query);
      // Set the initial value
      setMatches(mediaQuery.matches);

      // Define a callback function to handle changes to the media query
      const handleChange = (event: MediaQueryListEvent) => {
        setMatches(event.matches);
      };

      // Add the callback as a listener for changes to the media query
      mediaQuery.addEventListener('change', handleChange);

      // Clean up the listener when the component is unmounted
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
    // If window is not available, keep the default false
    return undefined;
  }, [query]); // Re-run the effect if the query changes

  return matches;
}

/**
 * Hook to detect if the current device is mobile based on screen width
 * @param mobileBreakpoint The maximum width to consider a device mobile (default: 768px)
 * @returns A boolean indicating whether the device is considered mobile
 */
export function useMobileDetection(mobileBreakpoint: number = 768): boolean {
  const isMobile = useMediaQuery(`(max-width: ${mobileBreakpoint}px)`);
  return isMobile;
}

/**
 * Hook to detect if device supports touch
 * @returns A boolean indicating whether touch is supported
 */
export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    // Check if running in a browser environment
    if (typeof window !== 'undefined') {
      // Set to true if any of these touch APIs exist
      const hasTouch = 
        'ontouchstart' in window || 
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore - NavigatorUAData may not be in all TypeScript definitions
        (navigator.userAgentData?.mobile ?? false);
      
      setIsTouch(hasTouch);
    }
  }, []); // Empty dependency array means this runs once on mount

  return isTouch;
}

/**
 * Combined hook that returns various device information
 * @returns An object with device information
 */
export function useDeviceDetection() {
  const isMobile = useMobileDetection();
  const isTouch = useTouchDevice();
  const isTablet = useMediaQuery('(min-width: 601px) and (max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const isLandscape = useMediaQuery('(orientation: landscape)');

  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouch,
    isPortrait,
    isLandscape
  };
}

export default useDeviceDetection; 