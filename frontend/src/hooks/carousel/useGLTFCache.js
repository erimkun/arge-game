import { useEffect, useMemo, useState, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import { Box3, Vector3 } from 'three';

/**
 * useGLTFCache
 * Single Responsibility: GLB modellerini yükler, merkezler ve cache'ler
 */
export function useGLTFCache(path, { targetHeight = 1.8 } = {}) {
  const [error, setError] = useState(null);

  // Preload model
  useEffect(() => {
    if (path) {
      try {
        useGLTF.preload(path);
      } catch (err) {
        console.error('[useGLTFCache] Preload error:', path, err);
        setError(err);
      }
    }
  }, [path]);

  // Load model - useGLTF handles null/undefined gracefully
  let gltf;
  if (path) {
    try {
      gltf = useGLTF(path);
    } catch (err) {
      // Suspended promise is expected, don't treat as error
      if (err && err.then && typeof err.then === 'function') {
        throw err; // Re-throw suspended promises
      }
      console.error('[useGLTFCache] useGLTF error:', path, err);
      setError(err);
      gltf = null;
    }
  } else {
    gltf = null;
  }

  const preparedScene = useMemo(() => {
    // Return null if error occurred
    if (error) {
      return null;
    }

    // Null safety: Ensure GLTF and scene exist
    if (!gltf || !gltf.scene) {
      if (path) {
        console.warn('[useGLTFCache] GLTF or scene not loaded:', path);
      }
      return null;
    }

    try {
      // Clone with validation
      const cloned = gltf.scene.clone(true);
      
      // Validate cloned object has required properties
      if (!cloned) {
        console.error('[useGLTFCache] Clone failed');
        return null;
      }

      if (!cloned.position || !cloned.scale || !cloned.rotation) {
        console.error('[useGLTFCache] Invalid cloned object structure - missing transform properties');
        return null;
      }

      // Safe bounding box calculation
      const box = new Box3().setFromObject(cloned);
      if (box.isEmpty()) {
        console.warn('[useGLTFCache] Empty bounding box, returning unscaled model');
        return cloned;
      }

      const size = new Vector3();
      const center = new Vector3();
      
      // Validate box operations
      try {
        box.getSize(size);
        box.getCenter(center);
      } catch (boxError) {
        console.error('[useGLTFCache] Box calculation error:', boxError);
        return cloned;
      }

      // Safe position adjustment
      if (cloned.position && center && center.x !== undefined) {
        try {
          cloned.position.sub(center);
        } catch (posError) {
          console.error('[useGLTFCache] Position adjustment error:', posError);
        }
      }

      // Safe scaling with validation
      if (size && size.y > 0 && Number.isFinite(targetHeight) && cloned.scale) {
        const scale = targetHeight / size.y;
        if (Number.isFinite(scale) && scale > 0) {
          try {
            cloned.scale.setScalar(scale);
          } catch (scaleError) {
            console.error('[useGLTFCache] Scaling error:', scaleError);
          }
        }
      }

      return cloned;
    } catch (error) {
      console.error('[useGLTFCache] Error processing model:', path, error);
      return null;
    }
  }, [gltf, targetHeight, path, error]);

  return preparedScene;
}

export default useGLTFCache;

