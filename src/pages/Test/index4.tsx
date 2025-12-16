import { Flex, Box, Text } from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";

interface KeyboardKeyProps {
  char: string;
  isSpace: boolean;
}

const KeyboardKey = React.forwardRef<HTMLDivElement, KeyboardKeyProps>(
  ({ char, isSpace }, ref) => {
    return !isSpace ? (
      <Box
        ref={ref}
        as="div"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        w={isSpace ? "60px" : "40px"}
        h="40px"
        bg="gray.100"
        borderRadius="md"
        boxShadow="0px 4px 0px #cbd5e0"
        border="1px solid"
        borderColor="gray.200"
        color="gray.700"
        fontWeight="bold"
        fontSize="lg"
        m="2px"
        userSelect="none"
        style={{
          willChange: "transform",
        }}
      >
        {char}
      </Box>
    ) : (
      <Box
        ref={ref}
        as="div"
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        w={isSpace ? "60px" : "40px"}
        h="40px"
        m="2px"
        userSelect="none"
        style={{
          willChange: "transform",
        }}
      ></Box>
    );
  }
);

const FallingText = ({ text, trigger }: { text: string; trigger: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const engineRef = useRef<Matter.Engine | null>(null);
  const runnerRef = useRef<Matter.Runner | null>(null);

  useEffect(() => {
    // Only run physics if triggered
    if (!trigger || !containerRef.current) return;

    const container = containerRef.current;

    // 1. Setup Matter.js
    const Engine = Matter.Engine,
      Runner = Matter.Runner,
      Bodies = Matter.Bodies,
      World = Matter.World,
      Events = Matter.Events;

    // Create engine
    const engine = Engine.create();
    engineRef.current = engine;

    // Measure positions of all items
    const bodies: Matter.Body[] = [];
    const itemElements = itemsRef.current;

    const containerRect = container.getBoundingClientRect();

    itemElements.forEach((el) => {
      if (!el) return;

      // Measure BEFORE changing to absolute
      const rect = el.getBoundingClientRect();

      // Calculate center relative to container
      const x = rect.left - containerRect.left + rect.width / 2;
      const y = rect.top - containerRect.top + rect.height / 2;

      // Lock dimensions and position visibly before switching to physics control
      el.style.width = `${rect.width}px`;
      el.style.height = `${rect.height}px`;

      // Create body matching the element
      const body = Bodies.rectangle(x, y, rect.width, rect.height, {
        restitution: 0.5 + Math.random() * 0.5, // Random bounciness (0.5 - 1.0)
        friction: 0.1,
        frictionAir: 0.01 + Math.random() * 0.05, // Varied air resistance simulating different falling speeds
        angle: (Math.random() - 0.5) * 0.5, // Slight random initial tilt
      });

      // Apply random initial forces for "jitter" and scattering
      Matter.Body.setVelocity(body, {
        x: (Math.random() - 0.5) * 10, // Random horizontal velocity
        y: Math.random() * 5, // Slight initial upward/downward pop
      });

      Matter.Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.2); // Random spin

      (body as any).userData = {
        element: el,
        initialWidth: rect.width,
        initialHeight: rect.height,
      };

      bodies.push(body);
    });

    // Add boundaries
    // Floor
    const ground = Bodies.rectangle(
      containerRect.width / 2,
      containerRect.height + 60, // slightly below view
      containerRect.width,
      100,
      { isStatic: true }
    );

    // Walls
    const wallLeft = Bodies.rectangle(
      -50,
      containerRect.height / 2,
      100,
      containerRect.height * 2,
      { isStatic: true }
    );

    const wallRight = Bodies.rectangle(
      containerRect.width + 50,
      containerRect.height / 2,
      100,
      containerRect.height * 2,
      { isStatic: true }
    );

    World.add(engine.world, [...bodies, ground, wallLeft, wallRight]);

    // 2. Switch elements to absolute positioning relative to the container
    // We already measured them, so now we position them absolutely at the same spot to initialize.
    itemElements.forEach((el) => {
      if (!el) return;
      // We rely on the first update of the physics engine to set the transform,
      // BUT to avoid a frame of "jumping", we should ideally set it now.
      // However, we can just set position absolute and left/top 0 and let the transform handle it immediately.

      el.style.position = "absolute";
      el.style.left = "0px";
      el.style.top = "0px";
      el.style.margin = "0px"; // Remove margin as it complicates absolute positioning
    });

    // Update loop
    const onAfterUpdate = () => {
      bodies.forEach((body) => {
        const el = (body as any).userData?.element as HTMLElement;
        if (el) {
          const { x, y } = body.position;
          const angle = body.angle;
          const w = (body as any).userData.initialWidth;
          const h = (body as any).userData.initialHeight;

          el.style.transform = `translate(${x - w / 2}px, ${
            y - h / 2 - 30
          }px) rotate(${angle}rad)`;
        }
      });
    };

    // Bind update event
    Events.on(engine, "afterUpdate", onAfterUpdate);

    // Initial positioning update before running to prevent flash
    onAfterUpdate();

    // Run the engine
    const runner = Runner.create();
    runnerRef.current = runner;
    Runner.run(runner, engine);

    return () => {
      Runner.stop(runner);
      Engine.clear(engine);
      Events.off(engine, "afterUpdate", onAfterUpdate);
    };
  }, [trigger, text]); // Re-run if trigger changes to true

  return (
    <Box
      ref={containerRef}
      w="100%"
      h="100%"
      position="relative"
      overflow="hidden"
    >
      {/* 
        Initially standard flow (Flex). 
        When trigger=true, the JS measures them and sets position:absolute on the DOM nodes directly.
      */}
      <Flex
        wrap="wrap"
        justify="center"
        align="center"
        rowGap={"2rem"}
        w="100%"
        h={trigger ? "100%" : "auto"}
        pt={trigger ? 0 : 20} // Some padding initially to place them nicely
      >
        {text.split("").map((char, i) => (
          <KeyboardKey
            key={i}
            char={char}
            isSpace={char === " "}
            ref={(el) => {
              itemsRef.current[i] = el;
            }}
          />
        ))}
      </Flex>
    </Box>
  );
};

const Test4 = () => {
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fake loader 0 -> 100
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setLoading(false);
          return 100;
        }
        return prev + 1; // Increment speed
      });
    }, 30); // 30ms * 100 = 3 seconds approx

    return () => clearInterval(interval);
  }, []);

  return (
    <Flex
      w="100vw"
      h="100vh"
      align="center"
      justify="center"
      bg={"black"}
      transition="background-color 0.5s ease"
      position="relative"
    >
      <Box w="80vw" h="80vh">
        {/* Text Component */}
        {/* We pass !loading as trigger. When not loading (progress 100), physics starts. */}
        <FallingText text="Welcome to my site" trigger={!loading} />
      </Box>

      {/* Loader Counter */}
      {loading && (
        <Text
          position="absolute"
          bottom="50px"
          left="50px"
          color="white"
          fontSize="6xl"
          fontWeight="bold"
          fontFamily="monospace"
        >
          {progress}
        </Text>
      )}
    </Flex>
  );
};

export default Test4;
