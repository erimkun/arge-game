import { useCallback, useRef } from 'react';

/**
 * useTouchControls
 * Single Responsibility: Carousel için touch & drag hareketlerini yönetir
 */
export function useTouchControls({ onSwipeLeft, onSwipeRight, swipeThreshold = 40 }) {
  const touchStartXRef = useRef(null);
  const touchStartTimeRef = useRef(null);

  const handleTouchStart = useCallback((event) => {
    const touch = event.touches[0];
    touchStartXRef.current = touch.clientX;
    touchStartTimeRef.current = performance.now();
  }, []);

  const handleTouchEnd = useCallback(
    (event) => {
      if (touchStartXRef.current === null) return;

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartXRef.current;
      const duration = performance.now() - (touchStartTimeRef.current ?? performance.now());

      const isSwipe = Math.abs(deltaX) > swipeThreshold && duration < 600;
      if (isSwipe) {
        if (deltaX < 0) {
          onSwipeLeft?.();
        } else {
          onSwipeRight?.();
        }
      }

      touchStartXRef.current = null;
      touchStartTimeRef.current = null;
    },
    [onSwipeLeft, onSwipeRight, swipeThreshold]
  );

  const bind = {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };

  return bind;
}

