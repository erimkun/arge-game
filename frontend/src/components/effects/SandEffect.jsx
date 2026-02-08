import { useRef, useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 2500;
const GRAVITY_STRENGTH = 0.15;
const FRICTION = 0.96;
const MOUSE_RADIUS = 1.5;
const MOUSE_FORCE = 0.5;

export default function SandEffect() {
    const meshRef = useRef();
    const { viewport, mouse } = useThree();
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Initialize particles with random positions and zero velocity
    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            temp.push({
                x: (Math.random() - 0.5) * viewport.width,
                y: (Math.random() - 0.5) * viewport.height,
                z: 0,
                vx: 0,
                vy: 0,
                color: new THREE.Color().setHSL(0.1 + Math.random() * 0.1, 0.8, 0.5 + Math.random() * 0.3) // Sand/Gold colors
            });
        }
        return temp;
    }, [viewport.width, viewport.height]);

    // Orientation / Gravity vector
    const gravity = useRef(new THREE.Vector2(0, -GRAVITY_STRENGTH));

    useEffect(() => {
        const handleOrientation = (event) => {
            const { gamma, beta } = event; // gamma: left-to-right, beta: front-to-back
            if (gamma === null || beta === null) return;

            // Normalize roughly to -1 to 1 range for simple 2D gravity simulation
            // Gamma: -90 to 90 (left/right tilt)
            // Beta: -180 to 180 (front/back tilt)

            // We want landscape/portrait to essentially just change "down" direction
            // Simple approximation:
            const x = Math.sin((gamma * Math.PI) / 180);
            const y = -Math.cos((gamma * Math.PI) / 180) * Math.cos((beta * Math.PI) / 180); // simplified

            // More robust simple mapping for general hand-held usage:
            // Let's just map x/y directly from gamma/beta for 2D plane falling
            const gravityX = gamma ? gamma / 45 : 0;
            const gravityY = beta ? -beta / 45 : -1;

            // Clamping and setting
            gravity.current.set(
                Math.max(-1, Math.min(1, gravityX)) * GRAVITY_STRENGTH,
                Math.max(-1, Math.min(1, gravityY)) * GRAVITY_STRENGTH
            );
        };

        window.addEventListener('deviceorientation', handleOrientation);
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, []);


    useFrame(() => {
        if (!meshRef.current) return;

        // Mouse position in world space
        const mx = (mouse.x * viewport.width) / 2;
        const my = (mouse.y * viewport.height) / 2;

        particles.forEach((p, i) => {
            // 1. Apply Gravity
            p.vx += gravity.current.x * 0.1; // Add some drag/inertia scaling
            p.vy += gravity.current.y * 0.1;

            // 2. Apply Mouse Interaction (Repulsion)
            const dx = p.x - mx;
            const dy = p.y - my;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < MOUSE_RADIUS) {
                const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
                const angle = Math.atan2(dy, dx);
                p.vx += Math.cos(angle) * force * MOUSE_FORCE;
                p.vy += Math.sin(angle) * force * MOUSE_FORCE;
            }

            // 3. Move
            p.x += p.vx;
            p.y += p.vy;

            // 4. Friction
            p.vx *= FRICTION;
            p.vy *= FRICTION;

            // 5. Boundary & Accumulation (Simple wall bounce with energy loss)
            const hw = viewport.width / 2;
            const hh = viewport.height / 2;
            const r = 0.05; // Particle approx radius

            // Floor (Bottom)
            if (p.y < -hh + r) {
                p.y = -hh + r;
                p.vy *= -0.4; // Bounce
                p.vx *= 0.9; // Friction against floor
            }
            // Ceiling (Top)
            if (p.y > hh - r) {
                p.y = hh - r;
                p.vy *= -0.4;
            }
            // Walls
            if (p.x < -hw + r) {
                p.x = -hw + r;
                p.vx *= -0.4;
            }
            if (p.x > hw - r) {
                p.x = hw - r;
                p.vx *= -0.4;
            }

            // 6. Update InstancedMesh Matrix
            dummy.position.set(p.x, p.y, p.z);
            // dummy.rotation.z += p.vx * 0.1; // Rotate based on velocity
            dummy.scale.setScalar(0.1 + Math.abs(p.vx) * 0.05); // Stretch slightly based on speed
            dummy.updateMatrix();

            meshRef.current.setMatrixAt(i, dummy.matrix);
            // Optional: Update color dynamically if needed, but static color set initially is faster
            // meshRef.current.setColorAt(i, p.color);
        });

        meshRef.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={meshRef} args={[null, null, PARTICLE_COUNT]}>
            <circleGeometry args={[0.08, 8]} />
            <meshStandardMaterial
                color="#FCD34D"
                emissive="#F59E0B"
                emissiveIntensity={0.2}
                roughness={0.5}
                transparent
                opacity={0.8}
            />
        </instancedMesh>
    );
}
