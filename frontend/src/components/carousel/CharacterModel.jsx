import { Suspense } from 'react';
import { Html } from '@react-three/drei';
import PropTypes from 'prop-types';
import useGLTFCache from '../../hooks/carousel/useGLTFCache';

/**
 * CharacterModel
 * Single Responsibility: GLB modelini yükleyip sahnede render eder
 */
function CharacterModelInner({ modelPath, targetHeight }) {
  if (!modelPath) {
    return null;
  }

  const model = useGLTFCache(modelPath, { targetHeight });

  // If model not loaded yet, let Suspense handle it
  if (!model) {
    return null;
  }

  // Validate it's a Three.js object
  if (!model.type) {
    console.warn('[CharacterModel] Invalid model object:', modelPath);
    return null;
  }

  return <primitive object={model} dispose={null} />;
}

CharacterModelInner.propTypes = {
  modelPath: PropTypes.string,
  targetHeight: PropTypes.number,
};

export function CharacterModel({ modelPath, targetHeight = 1.8, fallback }) {
  if (!modelPath) {
    return fallback ?? null;
  }

  return (
    <Suspense
      fallback={
        fallback ?? (
          <Html center>
            <div className="rounded-full bg-indigo-200/60 px-3 py-1 text-xs text-indigo-800">
              Yükleniyor...
            </div>
          </Html>
        )
      }
    >
      <CharacterModelInner modelPath={modelPath} targetHeight={targetHeight} />
    </Suspense>
  );
}

CharacterModel.propTypes = {
  modelPath: PropTypes.string,
  targetHeight: PropTypes.number,
  fallback: PropTypes.node,
};

export default CharacterModel;

