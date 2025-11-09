import PropTypes from 'prop-types';
import { Html } from '@react-three/drei';
import { DoubleSide } from 'three';
import CharacterModel from './CharacterModel';

/**
 * CenterAvatarModel
 * Single Responsibility: Kullanıcının modelini merkezde gösterir
 */
export function CenterAvatarModel({ profile }) {
  // Defensive check: Validate profile
  if (!profile || !profile.id) {
    console.warn('[CenterAvatarModel] Invalid profile data');
    return null;
  }

  const modelPath = profile.model;
  const fallback = (
    <Html center>
      <div className="flex h-32 w-32 flex-col items-center justify-center gap-2 rounded-full bg-white/70 shadow-lg backdrop-blur">
        <img
          src={profile.avatar || 'https://via.placeholder.com/150/6B46C1/FFFFFF?text=AVTR'}
          alt={profile.name || 'Avatar'}
          className="h-16 w-16 rounded-full object-cover"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/150/6B46C1/FFFFFF?text=AVTR';
          }}
        />
        <p className="text-sm font-semibold text-indigo-700">{profile.name || 'Unknown'}</p>
      </div>
    </Html>
  );

  return (
    <group position={[0, -0.1, 0]}>
      <group position={[0, 0, 0]}>
        <CharacterModel modelPath={modelPath} targetHeight={2.2} fallback={fallback} />
      </group>
    </group>
  );
}

CenterAvatarModel.propTypes = {
  profile: PropTypes.shape({
    name: PropTypes.string,
    avatar: PropTypes.string,
    model: PropTypes.string,
  }),
};

export default CenterAvatarModel;

