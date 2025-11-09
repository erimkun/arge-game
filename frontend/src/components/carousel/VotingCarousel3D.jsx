import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { Html, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useCarousel } from '../../hooks/carousel/useCarousel';
import { useKeyboardControls } from '../../hooks/carousel/useKeyboardControls';
import { useTouchControls } from '../../hooks/carousel/useTouchControls';
import CharacterCard3D from './CharacterCard3D';
import CenterAvatarModel from './CenterAvatarModel';
import CarouselControls from './CarouselControls';
import ErrorBoundary from '../ErrorBoundary';


const CAROUSEL_RADIUS = 4;

// Dinamik animasyonlu gradient arka plan
function DynamicGradientBackground() {
  const meshRef = useRef();
  
  const shaderMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec2 vUv;
        
        void main() {
          vec2 uv = vUv * 2.0 - 1.0;
          float dist = length(uv);
          
          // Akan dalgalar - 4 farklı katman
          float wave1 = sin(dist * 3.0 - uTime * 0.5) * 0.5 + 0.5;
          float wave2 = sin(dist * 5.0 + uTime * 0.7) * 0.5 + 0.5;
          float wave3 = cos(dist * 4.0 - uTime * 0.3) * 0.5 + 0.5;
          float wave4 = cos(uv.x * 2.0 + uTime * 0.4) * sin(uv.y * 2.0 - uTime * 0.6) * 0.5 + 0.5;
          
          // Pulse efekti
          float pulse = sin(uTime * 1.5) * 0.1 + 0.9;
          
          // Renkler - mor, mavi, pembe, turuncu tonları
          vec3 color1 = vec3(0.4, 0.2, 0.8) * wave1 * pulse; // Mor
          vec3 color2 = vec3(0.2, 0.5, 1.0) * wave2; // Mavi
          vec3 color3 = vec3(0.9, 0.3, 0.6) * wave3; // Pembe
          vec3 color4 = vec3(1.0, 0.5, 0.2) * wave4 * pulse; // Turuncu
          
          // Renkleri karıştır
          vec3 finalColor = color1 + color2 * 0.7 + color3 * 0.5 + color4 * 0.3;
          
          // Parlaklık ve kontrast ayarı
          finalColor = mix(vec3(0.05, 0.05, 0.15), finalColor, 0.8);
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      side: THREE.BackSide,
    });
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      shaderMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]}>
      <sphereGeometry args={[50, 60, 40]} />
      <primitive object={shaderMaterial} attach="material" />
    </mesh>
  );
}

// Kamera bakış noktasını ayarlayan yardımcı bileşen
function CameraFocus({ target = [0, 4, -2] }) {
  const { camera } = useThree();
  useEffect(() => {
    camera.lookAt(...target);
  }, [camera, target]);
  return null;
}

function CarouselGroup({
  profiles,
  votes,
  activeIndex,
  angleStep,
  onSelectIndex,
}) {
  const carouselRef = useRef();
  const targetRotation = useMemo(() => -activeIndex * angleStep, [activeIndex, angleStep]);

  useFrame((_, delta) => {
    if (!carouselRef.current) return;
    const current = carouselRef.current.rotation.y;
    const diff = targetRotation - current;
    const speed = Math.min(1, delta * 5);
    carouselRef.current.rotation.y += diff * speed;
  });

  return (
    <group ref={carouselRef}>
      {profiles.map((profile, index) => {
        // Validate profile before rendering
        if (!profile || !profile.id) {
          console.warn('[CarouselGroup] Skipping invalid profile at index', index);
          return null;
        }

        const angle = index * angleStep;
        const x = Math.sin(angle) * CAROUSEL_RADIUS;
        const z = Math.cos(angle) * CAROUSEL_RADIUS;
        const isActive = index === activeIndex;

        const voteCount = votes?.[profile.id] ?? 0;

        return (
          <group
            key={profile.id}
            position={[x, 0, z]}
            rotation={[0, angle + Math.PI, 0]}
          >
            <CharacterCard3D
              profile={profile}
              voteCount={voteCount}
              isActive={isActive}
              onSelect={() => onSelectIndex(index)}
            />
          </group>
        );
      })}
    </group>
  );
}

CarouselGroup.propTypes = {
  profiles: PropTypes.arrayOf(PropTypes.object).isRequired,
  votes: PropTypes.object,
  activeIndex: PropTypes.number.isRequired,
  angleStep: PropTypes.number.isRequired,
  onSelectIndex: PropTypes.func.isRequired,
};

export function VotingCarousel3D({
  profiles,
  votes,
  myProfile,
  onActiveProfileChange,
  onVote,
  hasVoted,
  votedProfileId,
}) {
  const { angleStep, targetIndex, setIndex, goNext, goPrev, length } = useCarousel(profiles.length);

  // (Character preview modal removed)

  const handleActiveChange = useCallback(
    (index) => {
      const next = Math.max(0, Math.min(index, profiles.length - 1));
      setIndex(next);
    },
    [profiles.length, setIndex]
  );

  useEffect(() => {
    if (profiles.length === 0) {
      onActiveProfileChange?.(null);
      return;
    }
    onActiveProfileChange?.(profiles[targetIndex] ?? null);
  }, [profiles, targetIndex, onActiveProfileChange]);

  useKeyboardControls({ onNext: goNext, onPrev: goPrev, enabled: profiles.length > 1 });
  const touchHandlers = useTouchControls({ onSwipeLeft: goNext, onSwipeRight: goPrev });

  const activeProfile = profiles[targetIndex];
  const activeVoteCount = activeProfile ? votes?.[activeProfile.id] ?? 0 : 0;
  const canVote = Boolean(activeProfile && !hasVoted && activeProfile.id !== myProfile?.id);
  const alreadyVoted = Boolean(activeProfile && votedProfileId === activeProfile.id);

  return (
    <ErrorBoundary>
      <div
        className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50"
        {...(profiles.length > 1 ? touchHandlers : {})}
      >
        <Canvas 
          className="h-full w-full" 
          shadows 
          camera={{ 
            position: myProfile?.model ? [0, 4, -5] : [0, 2, 9], 
            fov: 30
          }}
        >
          {/* Kamera bakış noktasını biraz ileriye ayarladık */}
          <CameraFocus target={[0, 1, 1]} />
          
          {/* Dinamik animasyonlu gradient arka plan */}
          <DynamicGradientBackground />
          
          <ambientLight intensity={0.5} />
          <spotLight
            position={[0, 6, 6]}
            intensity={0.8}
            angle={0.25}
            penumbra={0.5}
            castShadow
          />
          <spotLight position={[0, 4, -6]} intensity={0.4} angle={0.3} penumbra={0.4} color={0x8ea5ff} />
          <Environment preset="city" />

          {myProfile && <CenterAvatarModel profile={myProfile} />}

          <Suspense fallback={<Html center>Yükleniyor...</Html>}>
            <CarouselGroup
              profiles={profiles}
              votes={votes}
              activeIndex={targetIndex}
              angleStep={angleStep || (Math.PI * 2)}
              onSelectIndex={handleActiveChange}
            />
          </Suspense>

          
        </Canvas>

        {/* Oylama devam ediyor kutusu - üstte */}
        {myProfile && (
          <div className="absolute top-14 left-1/2 transform -translate-x-1/2 z-20 flex items-center justify-center w-full
            sm:top-8 sm:px-0
            px-2 ">
            <div className="rounded-3xl bg-white/90 backdrop-blur shadow-2xl flex items-center gap-4 border-2 border-indigo-200
              min-w-[220px] max-w-[350px] h-[48px] px-2 py-2
              sm:min-w-[400px] sm:max-w-[700px] sm:h-[72px] sm:px-10 sm:py-3">
              <span className="text-sm sm:text-lg font-bold text-indigo-700">Oylama devam ediyor</span>
              <img
                src={myProfile.avatar}
                alt={myProfile.name}
                className="h-8 w-8 sm:h-12 sm:w-12 rounded-full border-4 border-indigo-400 object-cover shadow-lg"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/150/6B46C1/FFFFFF?text=AVTR';
                }}
              />
              <span className="text-xs sm:text-base font-semibold text-gray-800">{myProfile.name} olarak</span>
            </div>
          </div>
        )}

        {/* Voting Box - Outside Canvas */}
  <div className="pointer-events-auto absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-4 sm:gap-8 z-10 px-2 sm:px-0">
          {/* Left Navigation Button */}
          {length > 1 && (
            <button
              onClick={goPrev}
              className="rounded-full bg-white/95 p-2 sm:p-3 shadow-xl hover:bg-white transition backdrop-blur-sm border-2 border-indigo-300 hover:border-indigo-400"
            >
              <span className="text-xl sm:text-2xl font-bold text-indigo-600">←</span>
            </button>
          )}

          {/* Center Voting Box */}
          {activeProfile && (
            <div className="rounded-3xl bg-white/95 backdrop-blur shadow-2xl p-6 w-80 text-center border-2 border-indigo-200">
              <div className="mb-4">
                <img
                  src={activeProfile.avatar}
                  alt={activeProfile.name}
                  className="h-20 w-20 rounded-full border-4 border-indigo-400 object-cover shadow-lg mx-auto mb-3"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/150/6B46C1/FFFFFF?text=AVTR';
                  }}
                />
                <p className="text-2xl font-bold text-gray-900">{activeProfile.name}</p>
                <p className="text-sm font-semibold text-indigo-600">Oylar: {activeVoteCount}</p>
              </div>
              
              <button
                type="button"
                onClick={() => activeProfile && onVote?.(activeProfile.id)}
                disabled={!canVote}
                className={`w-full rounded-xl py-4 px-6 text-lg font-bold transition-all ${
                  canVote
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:shadow-lg scale-100 hover:scale-105'
                    : 'bg-slate-300 text-slate-600 cursor-not-allowed'
                }`}
              >
                {alreadyVoted
                  ? '✓ Oy Verdiniz'
                  : hasVoted
                  ? '✗ Oy Kullanıldı'
                  : '🗳️ OY VER'}
              </button>
            </div>
          )}

          {/* Right Navigation Button */}
          {length > 1 && (
            <button
              onClick={goNext}
              className="rounded-full bg-white/95 p-2 sm:p-3 shadow-xl hover:bg-white transition backdrop-blur-sm border-2 border-indigo-300 hover:border-indigo-400"
            >
              <span className="text-xl sm:text-2xl font-bold text-indigo-600">→</span>
            </button>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

VotingCarousel3D.propTypes = {
  profiles: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      avatar: PropTypes.string,
      model: PropTypes.string,
    })
  ),
  votes: PropTypes.object,
  myProfile: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    avatar: PropTypes.string,
    model: PropTypes.string,
  }),
  onActiveProfileChange: PropTypes.func,
  onVote: PropTypes.func,
  hasVoted: PropTypes.bool,
  votedProfileId: PropTypes.string,
};

VotingCarousel3D.defaultProps = {
  profiles: [],
  votes: {},
  myProfile: null,
  onActiveProfileChange: undefined,
  onVote: undefined,
  hasVoted: false,
  votedProfileId: null,
};

export default VotingCarousel3D;

