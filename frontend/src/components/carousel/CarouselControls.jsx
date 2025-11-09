import PropTypes from 'prop-types';

/**
 * CarouselControls
 * Single Responsibility: Carousel navigasyon butonlarını render eder
 */
export function CarouselControls({ onPrev, onNext, disabledPrev = false, disabledNext = false }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-4">
      <button
        type="button"
        onClick={onPrev}
        className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur transition hover:bg-white"
        aria-label="Önceki kart"
        disabled={disabledPrev}
      >
        <span className="text-2xl text-indigo-600">‹</span>
      </button>
      <button
        type="button"
        onClick={onNext}
        className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur transition hover:bg-white"
        aria-label="Sonraki kart"
        disabled={disabledNext}
      >
        <span className="text-2xl text-indigo-600">›</span>
      </button>
    </div>
  );
}

CarouselControls.propTypes = {
  onPrev: PropTypes.func,
  onNext: PropTypes.func,
  disabledPrev: PropTypes.bool,
  disabledNext: PropTypes.bool,
};

export default CarouselControls;

