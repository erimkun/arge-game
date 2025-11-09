import { useEffect } from 'react';

/**
 * useKeyboardControls
 * Single Responsibility: Carousel için klavye event'lerini yönetir
 */
export function useKeyboardControls({ onNext, onPrev, enabled = true }) {
  useEffect(() => {
    if (!enabled) {
      return () => undefined;
    }

    const handleKeyDown = (event) => {
      if (event.defaultPrevented) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        onNext?.();
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onPrev?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, onNext, onPrev]);
}

export default useKeyboardControls;

