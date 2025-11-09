import PropTypes from 'prop-types';
import { Html } from '@react-three/drei';
import CharacterModel from './CharacterModel';

/**
 * CharacterCard3D
 * Single Responsibility: Profil kartını ve mini modelini 3D sahnede gösterir
 */
export function CharacterCard3D({
  profile,
  voteCount = 0,
  isActive = false,
  onSelect,
}) {
  // Defensive check: Validate profile object
  if (!profile || !profile.id) {
    console.error('[CharacterCard3D] Invalid profile data');
    return null;
  }

  return (
    <group onClick={onSelect} onPointerDown={onSelect}>
      <group position={[0, 0, 0]}>
        <CharacterModel
          modelPath={profile.model || ''}
          targetHeight={1.6}
        />
      </group>

      <Html
        transform
        distanceFactor={2}
        position={[0, 1.2, 0.05]}
        className="pointer-events-none select-none"
        zIndexRange={[0, 10]}
      >
        <div
          className={`flex flex-col items-center gap-2 rounded-2xl bg-white/95 px-5 py-3 shadow-2xl backdrop-blur-md transition-all duration-300 ${
            isActive ? 'border-2 border-indigo-500 shadow-indigo-300' : 'border-2 border-white/50'
          }`}
        >
          <img
            src={profile?.avatar}
            alt={profile?.name}
            className="h-14 w-14 rounded-full border-2 border-indigo-300 object-cover shadow-lg"
          />
          <p className="text-lg font-bold text-gray-900">{profile?.name}</p>
        </div>
      </Html>
    </group>
  );
}

CharacterCard3D.propTypes = {
  profile: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    avatar: PropTypes.string,
    model: PropTypes.string,
  }),
  voteCount: PropTypes.number,
  isActive: PropTypes.bool,
  onSelect: PropTypes.func,
};

export default CharacterCard3D;

