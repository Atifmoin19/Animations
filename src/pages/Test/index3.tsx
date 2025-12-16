import { Flex, Text, Box } from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";

// Helper to generate 3D-looking ball texture
const createGradTexture = (radius: number, color: string) => {
  const canvas = document.createElement("canvas");
  canvas.width = radius * 2;
  canvas.height = radius * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // 1. Solid Base Color
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(radius, radius, radius, 0, Math.PI * 2);
  ctx.fill();

  // 2. Subtle 3D Gradient Overlay
  const grd = ctx.createRadialGradient(
    radius * 0.7,
    radius * 0.7,
    radius * 0.1,
    radius,
    radius,
    radius
  );
  grd.addColorStop(0, "rgba(255, 255, 255, 0.5)"); // Softer highlight
  grd.addColorStop(0.4, "transparent"); // Show base color
  grd.addColorStop(1, "rgba(0, 0, 0, 0.2)"); // Subtle shadow

  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(radius, radius, radius, 0, Math.PI * 2);
  ctx.fill();

  // optional border for definition
  ctx.strokeStyle = "rgba(0,0,0,0.1)";
  ctx.lineWidth = 1;
  ctx.stroke();

  return canvas.toDataURL();
};

const Test3 = () => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [percent, setPercent] = useState(0);
  const engineRef = useRef<Matter.Engine | null>(null);
  const renderRef = useRef<Matter.Render | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);

  // Track area in a ref to access it inside event handlers/intervals without stale closures
  const statsRef = useRef({ totalArea: 0, maxArea: 0 });

  useEffect(() => {
    if (!sceneRef.current) return;

    // Module aliases
    const Engine = Matter.Engine,
      Render = Matter.Render,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      Composite = Matter.Composite,
      World = Matter.World,
      Events = Matter.Events,
      Query = Matter.Query,
      Mouse = Matter.Mouse,
      Body = Matter.Body;

    // Create engine
    const engine = Engine.create();
    engineRef.current = engine;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Pre-generate textures for performance
    const colors = [
      "#ff0000",
      "#00ff00",
      "#0000ff",
      "#ffff00",
      "#00ffff",
      "#ff00ff",
    ];
    // Map radius -> texture used simple caching logic if needed,
    // but for random sizes we might just generate limited set or on fly (on fly is okay for low count)
    // To stay efficient, let's use a fixed set of sizes for spawning
    const sizes = [15, 20, 25, 30];
    const textureCache: Record<string, string> = {};

    sizes.forEach((s) => {
      colors.forEach((c) => {
        textureCache[`${s}-${c}`] = createGradTexture(s, c);
      });
    });

    const getTexture = (r: number, c: string) => {
      // Find closest size for cache hit or generate
      // For simplicity, snapping to nearest size or just generating if not found
      const key = `${r}-${c}`;
      if (textureCache[key]) return textureCache[key];
      return createGradTexture(r, c);
    };

    // Create renderer
    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width,
        height,
        wireframes: false,
        background: "transparent",
        pixelRatio: window.devicePixelRatio,
      },
    });
    renderRef.current = render;

    // Create boundaries
    const ground = Bodies.rectangle(width / 2, height + 60, width, 120, {
      isStatic: true,
      render: { fillStyle: "transparent" },
    });
    const leftWall = Bodies.rectangle(-60, height / 2, 120, height * 2, {
      isStatic: true,
      render: { fillStyle: "transparent" },
    });
    const rightWall = Bodies.rectangle(
      width + 60,
      height / 2,
      120,
      height * 2,
      {
        isStatic: true,
        render: { fillStyle: "transparent" },
      }
    );
    // Add a top cap way up high just in case particles go crazy, but let spawner fit under it
    // Or just rely on gravity. Walls are high enough (height * 2).

    World.add(engine.world, [ground, leftWall, rightWall]);

    // Setup mouse for interaction
    const mouse = Mouse.create(render.canvas);
    // Explicitly remove default mouse constraint binding to avoid interference, we will use custom logic

    // Spawner Config
    const totalArea = width * height;
    // Target 85% fill
    statsRef.current.maxArea = totalArea * 0.85;

    // Run
    Render.run(render);
    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);

    // Spawner Interval
    const interval = setInterval(() => {
      if (statsRef.current.totalArea >= statsRef.current.maxArea) {
        clearInterval(interval);
        setPercent(100);
        return;
      }

      // Random choice from sizes
      const r = sizes[Math.floor(Math.random() * sizes.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const texture = getTexture(r, color);

      const x = Math.random() * width;
      const ball = Bodies.circle(x, -100, r, {
        restitution: 0.6,
        render: {
          sprite: {
            texture: texture,
            xScale: 1, // Reset scale if texture size matches
            yScale: 1,
          },
        },
        label: "ball", // Tag for identification
      });
      // Store color/radius on the body for shattering logic later
      (ball as any).customColor = color;
      (ball as any).customRadius = r;

      World.add(engine.world, ball);
      statsRef.current.totalArea += Math.PI * r * r;

      // Update UI
      const p = Math.min(
        100,
        Math.round(
          (statsRef.current.totalArea / statsRef.current.maxArea) * 100
        )
      );
      setPercent(p);
    }, 30);

    // Interaction Listener
    const handleEvents = (event: MouseEvent | TouchEvent) => {
      const clientX =
        "touches" in event
          ? event.touches[0].clientX
          : (event as MouseEvent).clientX;
      const clientY =
        "touches" in event
          ? event.touches[0].clientY
          : (event as MouseEvent).clientY;

      const bodies = Query.point(Composite.allBodies(engine.world), {
        x: clientX,
        y: clientY,
      });

      bodies.forEach((body) => {
        if (body.label === "ball" && !body.isStatic) {
          // Shatter Logic
          World.remove(engine.world, body);

          const r = (body as any).customRadius || 20;
          const c = (body as any).customColor || "#ff0000";

          // Conservation of area: 1 big ball -> 4 small balls (half radius) - Area is exactly conserved.
          // pi*r^2 = 4 * (pi * (r/2)^2) = 4 * pi * r^2 / 4
          const shardRadius = r / 2;

          if (shardRadius < 5) return; // Too small, just vanish (area loss acceptable for dust)

          const shardTex = getTexture(shardRadius, c);

          for (let i = 0; i < 4; i++) {
            const shard = Bodies.circle(
              body.position.x,
              body.position.y,
              shardRadius,
              {
                restitution: 0.7,
                render: {
                  sprite: {
                    texture: shardTex,
                    xScale: 1,
                    yScale: 1,
                  },
                },
                label: "ball",
              }
            );
            (shard as any).customRadius = shardRadius;
            (shard as any).customColor = c;

            // Explode outwards
            const forceMagnitude = 0.05 * body.mass;
            Body.applyForce(shard, shard.position, {
              x: (Math.random() - 0.5) * forceMagnitude,
              y: (Math.random() - 0.5) * forceMagnitude,
            });

            World.add(engine.world, shard);
          }
        }
      });
    };

    // Attach listener to canvas
    render.canvas.addEventListener("mousedown", handleEvents);
    render.canvas.addEventListener("touchstart", handleEvents);

    return () => {
      clearInterval(interval);
      Render.stop(render);
      Runner.stop(runner);
      if (render.canvas) {
        render.canvas.removeEventListener("mousedown", handleEvents);
        render.canvas.removeEventListener("touchstart", handleEvents);
        render.canvas.remove();
      }
    };
  }, []);

  return (
    <Box position="relative" w="100%" h="100vh" bg="black" overflow="hidden">
      <div
        ref={sceneRef}
        style={{ position: "absolute", inset: 0, zIndex: 1 }}
      />
      <Flex
        position="absolute"
        top="0"
        left="0"
        w="100%"
        h="100%"
        align="center"
        justify="center"
        zIndex={2}
        pointerEvents="none"
      >
        <Text
          fontSize="9xl"
          fontWeight="bold"
          color="white"
          textShadow="0 0 20px rgba(0,0,0,0.5)"
          mixBlendMode="difference"
        >
          {percent}%
        </Text>
      </Flex>
    </Box>
  );
};

export default Test3;
