import { Box, Flex, Text } from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";

// --- Cloth Simulation Constants ---
const CLOTH_COLS = 20;
const CLOTH_ROWS = 25; // Dense enough for wrinkles
const PARTICLE_Radius = 2; // Small particles, mostly hidden
const CONSTRAINT_STIFFNESS = 0.2; // Not too stiff -> more wrinkles

const ClothOverlay = ({
  trigger,
  onFinish,
}: {
  trigger: boolean;
  onFinish?: () => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);
  const compositeRef = useRef<Matter.Composite | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 1. Setup Matter.js
    const Engine = Matter.Engine,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      Constraint = Matter.Constraint,
      Body = Matter.Body;

    const engine = Engine.create();
    engineRef.current = engine;
    const world = engine.world;

    engine.world.gravity.y = 1;

    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    // 2. Create Cloth Manually to ensure full screen coverage
    const bodies: Matter.Body[] = [];
    const constraints: Matter.Constraint[] = [];

    // Calculate precise particle spacing
    const spacingX = width / (CLOTH_COLS - 1);
    const spacingY = height / (CLOTH_ROWS - 1);

    for (let r = 0; r < CLOTH_ROWS; r++) {
      for (let c = 0; c < CLOTH_COLS; c++) {
        const x = c * spacingX;
        const y = r * spacingY;

        const body = Bodies.circle(x, y, PARTICLE_Radius, {
          friction: 0.05,
          frictionAir: 0.02,
          density: 0.002, // Heavier cloth
          collisionFilter: { group: Body.nextGroup(true) },
          render: { visible: false },
          isStatic: false,
        });

        bodies.push(body);

        // Add constraints immediately
        const currentIdx = r * CLOTH_COLS + c;

        // Horizontal constraint
        if (c > 0) {
          const leftBody = bodies[currentIdx - 1];
          const constraint = Constraint.create({
            bodyA: leftBody,
            bodyB: body,
            stiffness: CONSTRAINT_STIFFNESS,
            length: spacingX,
            render: { visible: false },
          });
          constraints.push(constraint);
        }

        // Vertical constraint
        if (r > 0) {
          const topBody = bodies[(r - 1) * CLOTH_COLS + c];
          const constraint = Constraint.create({
            bodyA: topBody,
            bodyB: body,
            stiffness: CONSTRAINT_STIFFNESS,
            length: spacingY,
            render: { visible: false },
          });
          constraints.push(constraint);
        }
      }
    }

    const clothComposite = Composite.create({ bodies, constraints });
    Composite.add(world, clothComposite);
    compositeRef.current = clothComposite;

    // 3. Pin the Top Row
    const pinnedConstraints: Matter.Constraint[] = [];
    for (let c = 0; c < CLOTH_COLS; c++) {
      const body = bodies[c];
      const constraint = Constraint.create({
        bodyA: body,
        pointB: { x: body.position.x, y: body.position.y },
        stiffness: 0.1,
        render: { visible: false },
      });
      pinnedConstraints.push(constraint);
      Composite.add(world, constraint);
    }

    // 4. Custom Renderer Loop
    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);

    let animationFrameId: number;

    const renderLoop = () => {
      if (!ctx || !engineRef.current) return; // Stop if unmounted
      ctx.clearRect(0, 0, width, height);

      // Draw the mesh quads
      for (let r = 0; r < CLOTH_ROWS - 1; r++) {
        for (let c = 0; c < CLOTH_COLS - 1; c++) {
          const i1 = r * CLOTH_COLS + c; // Top-Left
          const i2 = i1 + 1; // Top-Right
          const i3 = (r + 1) * CLOTH_COLS + c + 1; // Bottom-Right
          const i4 = (r + 1) * CLOTH_COLS + c; // Bottom-Left

          const p1 = bodies[i1].position;
          const p2 = bodies[i2].position;
          const p3 = bodies[i3].position;
          const p4 = bodies[i4].position;

          // Shade based on distortion
          const area =
            0.5 *
              Math.abs(
                p1.x * (p2.y - p3.y) +
                  p2.x * (p3.y - p1.y) +
                  p3.x * (p1.y - p2.y)
              ) +
            0.5 *
              Math.abs(
                p1.x * (p3.y - p4.y) +
                  p3.x * (p4.y - p1.y) +
                  p4.x * (p1.y - p3.y)
              );

          const restingArea = spacingX * spacingY;
          const ratio = area / restingArea;

          // "Glossy Black" Look
          let l = 5;

          if (ratio < 0.9) {
            const diff = (0.9 - ratio) * 10;
            l = 5 + Math.pow(diff, 2) * 5;
            l = Math.min(90, l);
          } else {
            l = Math.max(0, 5 - (ratio - 1.0) * 20);
          }

          ctx.fillStyle = `hsl(0, 0%, ${l}%)`;
          ctx.strokeStyle = `hsl(0, 0%, ${l}%)`;
          ctx.lineWidth = 1;

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.lineTo(p3.x, p3.y);
          ctx.lineTo(p4.x, p4.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      Runner.stop(runner);
      Engine.clear(engine);
    };
  }, []);

  // Handle Trigger (Gravity Drop)
  useEffect(() => {
    if (trigger && engineRef.current && compositeRef.current) {
      const engine = engineRef.current;
      const cloth = compositeRef.current;

      // 1. Release Top Pins immediately
      const allConstraints = Matter.Composite.allConstraints(engine.world);
      const pinConstraints = allConstraints.filter((c) => c.pointB && !c.bodyB);
      pinConstraints.forEach((c) => Matter.Composite.remove(engine.world, c));

      // 2. Apply slight disturbance for realism
      cloth.bodies.forEach((b) => {
        b.frictionAir = 0.02 + Math.random() * 0.04;
        Matter.Body.applyForce(b, b.position, {
          x: (Math.random() - 0.5) * 0.001,
          y: 0,
        });
      });

      // 3. Finish / Cleanup
      setTimeout(() => {
        if (onFinish) onFinish();
      }, 2000);
    }
  }, [trigger, onFinish]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 10,
        pointerEvents: "none",
      }}
    />
  );
};

// --- Main Preloader --

const Preloader = ({ children }: { children: React.ReactNode }) => {
  const [loadedPercent, setLoadedPercent] = useState(0);
  const [triggerFall, setTriggerFall] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  useEffect(() => {
    const loadAssets = async () => {
      // 1. Grab all image assets in the project
      const images = import.meta.glob("/src/assets/**/*.{png,jpg,jpeg,svg}", {
        eager: false,
      });
      const imageUrls = Object.values(images);
      const total = imageUrls.length;
      let loaded = 0;

      if (total === 0) {
        setLoadedPercent(100);
        return;
      }

      const updateProgress = () => {
        loaded++;
        const p = Math.round((loaded / total) * 100);
        setLoadedPercent((prev) => Math.max(prev, p));
      };

      // 2. Load each image
      imageUrls.forEach((importer) => {
        if (typeof importer === "function") {
          importer()
            .then((mod: any) => {
              const img = new Image();
              img.src = mod.default;
              img.onload = updateProgress;
              img.onerror = updateProgress;
            })
            .catch((e) => {
              console.error("Failed to load asset:", e);
              updateProgress();
            });
        }
      });
    };

    // Also check if window is already loaded for safety (though assets drive the %)
    if (document.readyState === "complete") {
      // We still run loadAssets to ensure visual parity with the progress bar
      loadAssets();
    } else {
      window.addEventListener("load", loadAssets);
      return () => window.removeEventListener("load", loadAssets);
    }

    // Fallback: If for some reason assets don't load or there are none,
    // we should ensure it eventually finishes?
    // For now, assuming loadAssets logic works as it tracks 'onerror' too.
    loadAssets();
  }, []);

  useEffect(() => {
    if (loadedPercent >= 100) {
      // Add a tiny delay so the user sees "100%" before it drops
      const timer = setTimeout(() => {
        setTriggerFall(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loadedPercent]);

  const handleFinish = () => {
    setShowOverlay(false);
  };

  return (
    <Flex
      w="100vw"
      h="100vh"
      position="relative"
      align="center"
      bg={"#000"}
      justify="center"
      overflow="hidden"
    >
      {/* Main Page Content (Revealed) */}
      {!showOverlay && (
        <Box zIndex={1} w="100%" h="100%">
          {children}
        </Box>
      )}

      {/* Cloth Overlay */}
      {showOverlay && (
        <Box
          position="absolute"
          top={0}
          left={0}
          w="100%"
          h="100%"
          zIndex={9999}
          pointerEvents="none"
        >
          <ClothOverlay trigger={triggerFall} onFinish={handleFinish} />

          {/* Real Loader Text */}
          {!triggerFall && (
            <Flex
              position="absolute"
              top={0}
              left={0}
              w="100%"
              h="100%"
              align="center"
              justify="center"
              zIndex={30}
            >
              <Text color="white" fontSize="9xl" fontWeight="bold">
                {loadedPercent}%
              </Text>
            </Flex>
          )}
        </Box>
      )}
    </Flex>
  );
};

export default Preloader;
