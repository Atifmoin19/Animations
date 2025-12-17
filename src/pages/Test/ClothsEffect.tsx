import { Box, Flex, Text } from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";
import RoboticWrapper from "../../components/RoboticWrapper";

// --- Cloth Simulation Constants ---
const CLOTH_COLS = 20;
const CLOTH_ROWS = 25; // Dense enough for wrinkles
const PARTICLE_Radius = 2; // Small particles, mostly hidden
const CONSTRAINT_STIFFNESS = 0.2; // Not too stiff -> more wrinkles
const REVEAL_SPEED = 0.05;

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

  // Adjust this to control speed (Lower = Slower).
  // 1.0 = Original fast snatch. 0.3 = Slow motion drag.
  const SNATCH_SPEED = 0.01;

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
      // Instead of pulling, we just let it fall, but we nudge it so it doesn't look like a rigid plate.
      cloth.bodies.forEach((b) => {
        // Randomize air friction slightly for flutter
        b.frictionAir = 0.02 + Math.random() * 0.04;

        // Slight initial push in random directions
        Matter.Body.applyForce(b, b.position, {
          x: (Math.random() - 0.5) * 0.001,
          y: 0,
        });
      });

      // 3. Finish / Cleanup
      // Gravity will take it down.
      // Falls h=height. Time t = sqrt(2h/g).
      // Matter.js gravity scale is arbitrary, usually takes a few seconds.

      setTimeout(() => {
        if (onFinish) onFinish();
      }, 3000);
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

const ClothReveal = () => {
  const [loading, setLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Fake loader 0-100
    if (count < 100) {
      const timeout = setTimeout(() => {
        setCount((prev) => prev + 1);
      }, 30); // 3 seconds to load
      return () => clearTimeout(timeout);
    } else {
      // 100 done
      setLoading(false);
    }
  }, [count]);

  const handleFinish = () => {
    setShowOverlay(false);
  };

  return (
    <RoboticWrapper
      title="CLOTH PHYSICS"
      description="Soft body simulation overlay with gravity reveal."
    >
      <Flex
        w="100%"
        h="100vh"
        position="relative"
        bg="transparent" // Dark theme from wrapper
        align="center"
        justify="center"
        overflow="hidden"
      >
        {/* 2. Main Page Content (Revealed) */}
        <Box zIndex={1} textAlign="center">
          <Text fontSize="6xl" fontWeight="bold" color="white">
            System Online
          </Text>
          <Text fontSize="xl" color="rgba(255,255,255,0.7)" mt={4}>
            Visual diagnostics complete.
          </Text>
        </Box>

        {/* 1. Black Box / Cloth Overlay */}
        {showOverlay && (
          <Box
            position="absolute"
            top={0}
            left={0}
            w="100%"
            h="100%"
            zIndex={20}
            pointerEvents="none"
          >
            <ClothOverlay trigger={!loading} onFinish={handleFinish} />

            {/* Loader Text on top of the Cloth */}
            {loading && (
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
                  {count}%
                </Text>
              </Flex>
            )}
          </Box>
        )}
      </Flex>
    </RoboticWrapper>
  );
};

export default ClothReveal;
