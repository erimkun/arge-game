import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * useCarousel
 * Single Responsibility: Carousel index ve rotasyon hedefini yönetir
 */
export function useCarousel(length) {
  const safeLength = Math.max(0, length);
  const angleStep = useMemo(() => (safeLength > 0 ? (Math.PI * 2) / safeLength : 0), [safeLength]);
  const [targetIndex, setTargetIndex] = useState(0);

  useEffect(() => {
    if (safeLength === 0) {
      setTargetIndex(0);
      return;
    }

    if (targetIndex >= safeLength) {
      setTargetIndex(0);
    }
  }, [safeLength, targetIndex]);

  const clampIndex = useCallback(
    (index) => {
      if (safeLength === 0) return 0;
      const normalized = ((index % safeLength) + safeLength) % safeLength;
      return normalized;
    },
    [safeLength]
  );

  const goNext = useCallback(() => {
    setTargetIndex((prev) => clampIndex(prev + 1));
  }, [clampIndex]);

  const goPrev = useCallback(() => {
    setTargetIndex((prev) => clampIndex(prev - 1));
  }, [clampIndex]);

  const setIndex = useCallback(
    (index) => {
      setTargetIndex(clampIndex(index));
    },
    [clampIndex]
  );

  return {
    angleStep,
    targetIndex,
    setIndex,
    goNext,
    goPrev,
    length: safeLength,
  };
}

