import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, useTexture, Billboard, Text } from "@react-three/drei";
import * as THREE from "three";
import { useRef, useMemo, useState, useEffect } from "react";
import { Box } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

// Assets
import circular from "assets/circular.png";
import delayCircular from "assets/delayCircular.png";
import elasticPhysics from "assets/spring.png";
import layered from "assets/Layered.png";
import clothReveal from "assets/ClothReveal.png";
import fallingText from "assets/falling-text.png";
import CardFlying from "assets/CardFlying.png";
import particleShatter from "assets/PhysicsShatter.png";
import folderStack from "assets/folder.png";

const CARD_DATA = [
  { link: "/circular-animation", image: circular, title: "Circular" },
  {
    link: "/delay-circular-animation",
    image: delayCircular,
    title: "Delay Circle",
  },
  {
    link: "/folder-stack-animation",
    image: folderStack,
    title: "Folder Stack",
  },
  { link: "/layered-interface", image: layered, title: "Layered UI" },
  { link: "/spring-bounce", image: elasticPhysics, title: "Spring Physics" },
  { link: "/physics-shatter", image: particleShatter, title: "Shatter" },
  { link: "/falling-text", image: fallingText, title: "Kinetic Type" },
  { link: "/cloth-reveal", image: clothReveal, title: "Cloth Reveal" },
  { link: "/card-scroll-trigger", image: CardFlying, title: "Scroll Fly" },
];

// Generate more items to fill the sphere
const NUM_ITEMS = 30;
const FULL_DATA = Array.from({ length: NUM_ITEMS }).map(
  (_, i) => CARD_DATA[i % CARD_DATA.length]
);

const RADIUS = 12;

/* ---------------- COMPONENT: SPHERE ITEM ---------------- */

const SphereItem = ({
  data,
  index,
  total,
}: {
  data: any;
  index: number;
  total: number;
}) => {
  const navigate = useNavigate();
  const texture = useTexture(data.image);

  // Fibonacci Sphere Algorithm for even distribution
  const position = useMemo(() => {
    const phi = Math.acos(-1 + (2 * index) / total);
    const theta = Math.sqrt(total * Math.PI) * phi;

    const x = RADIUS * Math.cos(theta) * Math.sin(phi);
    const y = RADIUS * Math.sin(theta) * Math.sin(phi);
    const z = RADIUS * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
  }, [index, total]);

  return (
    <group position={position}>
      {/* Billboard ensures the card always faces the camera */}
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            navigate(data.link);
            document.body.style.cursor = "default";
          }}
          onPointerOver={() => (document.body.style.cursor = "pointer")}
          onPointerOut={() => (document.body.style.cursor = "default")}
        >
          <planeGeometry args={[4, 3]} />
          <meshBasicMaterial
            map={texture}
            transparent
            opacity={0.9}
            side={THREE.DoubleSide}
          />
        </mesh>

        <Text
          position={[0, -2, 0]}
          fontSize={0.3}
          color="white"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="black"
        >
          {data.title.toUpperCase()}
        </Text>
      </Billboard>
    </group>
  );
};

/* ---------------- COMPONENT: CONTROLLER ---------------- */

const Controller = ({ children }: { children: React.ReactNode }) => {
  const groupRef = useRef<THREE.Group>(null);
  const isDragging = useRef(false);
  const previousMouse = useRef({ x: 0, y: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const rotationOffset = useRef({ x: 0, y: 0 }); // Tracks the accumulated energetic rotation

  useFrame((state) => {
    if (!groupRef.current) return;

    // 1. Calculate Mouse Look (Parallax)
    // Smoothly interpolate towards the mouse position
    // We use a small factor (0.1) so it just "tilts" slightly towards cursor
    const targetX = state.mouse.x * 0.2;
    const targetY = state.mouse.y * 0.2;

    // Apply inertia to the permanent rotation state
    if (!isDragging.current) {
      rotationOffset.current.y += velocity.current.x;
      rotationOffset.current.x += velocity.current.y;

      // MUCH smoother friction (0.99) for "heavy" fluid inertia
      velocity.current.x *= 0.91;
      velocity.current.y *= 0.91;
    }

    // 2. Apply combined rotation to the group
    // Base rotation (drag) + Mouse Look (hover)
    // We use lerp on the visual mesh for that extra "floaty" feel on the mouse look
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      rotationOffset.current.y + targetX,
      0.1
    );
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      rotationOffset.current.x - targetY, // Invert Y for natural look
      0.1
    );
  });

  const onPointerDown = (e: any) => {
    isDragging.current = true;
    previousMouse.current = { x: e.clientX, y: e.clientY };
    // Don't reset velocity immediately to zero if you want to "catch" it,
    // but for now, stopping it on grab is standard.
    velocity.current = { x: 0, y: 0 };
  };

  const onPointerMove = (e: any) => {
    if (!groupRef.current) return;

    // Calculate delta
    const dx = e.clientX - previousMouse.current.x;
    const dy = e.clientY - previousMouse.current.y;

    if (isDragging.current) {
      const SENSITIVITY = 0.003;

      // Directly update the offset state
      rotationOffset.current.y += dx * SENSITIVITY;
      rotationOffset.current.x += dy * SENSITIVITY;

      // "Heavy" throw: Blend new velocity with old to simulate mass
      // This prevents jerky stops if the last mouse event had small delta
      const lerpFactor = 0.8;
      velocity.current = {
        x: THREE.MathUtils.lerp(
          velocity.current.x,
          dx * SENSITIVITY,
          lerpFactor
        ),
        y: THREE.MathUtils.lerp(
          velocity.current.y,
          dy * SENSITIVITY,
          lerpFactor
        ),
      };
    }

    previousMouse.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = () => {
    isDragging.current = false;
  };

  // Global event listeners for smoother drag release outside canvas
  useEffect(() => {
    window.addEventListener("pointerup", onPointerUp);
    return () => window.removeEventListener("pointerup", onPointerUp);
  }, []);

  return (
    <group
      ref={groupRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
    >
      {/* Invisible hit sphere to catch drag events everywhere */}
      <mesh visible={false}>
        <sphereGeometry args={[RADIUS * 1.5, 32, 32]} />
        <meshBasicMaterial side={THREE.DoubleSide} />
      </mesh>

      {children}
    </group>
  );
};

/* ---------------- PAGE ---------------- */

export default function HomePage() {
  return (
    <Box w="100vw" h="100vh" bg="black" overflow="hidden">
      <Canvas camera={{ position: [0, 0, 0.1], fov: 75 }}>
        <color attach="background" args={["#050505"]} />
        <fog attach="fog" args={["#050505", 10, 35]} />

        <ambientLight intensity={1.5} />

        <Controller>
          {FULL_DATA.map((item, i) => (
            <SphereItem
              key={i}
              data={item}
              index={i}
              total={FULL_DATA.length}
            />
          ))}

          {/* Subtle starfield or particles to give depth */}
          <points>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={500}
                array={new Float32Array(1500).map(
                  () => (Math.random() - 0.5) * 50
                )}
                itemSize={3}
              />
            </bufferGeometry>
            <pointsMaterial
              size={0.1}
              color="#ffffff"
              transparent
              opacity={0.5}
            />
          </points>
        </Controller>
      </Canvas>

      {/* Overlay Intruction */}
      <Box
        position="absolute"
        bottom="10%"
        left="50%"
        transform="translateX(-50%)"
        color="white"
        fontFamily="monospace"
        pointerEvents="none"
        opacity={0.7}
      >
        DRAG TO EXPLORE
      </Box>
    </Box>
  );
}
