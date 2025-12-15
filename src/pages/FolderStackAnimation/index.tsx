import { Box, Flex, Image } from "@chakra-ui/react";
import React, { useRef } from "react";
import gsap from "gsap";

const CursorTrail = () => {
  const linesRef = useRef<SVGLineElement[]>([]);
  const mouse = useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  React.useEffect(() => {
    // Initial positions
    const dots: { x: number; y: number }[] = [];
    const count = 15; // More segments for smoother line
    for (let i = 0; i < count; i++) {
      dots.push({ x: 0, y: 0 });
    }

    const update = () => {
      dots.forEach((dot, index) => {
        const nextDot = index === 0 ? mouse.current : dots[index - 1];

        const ease = 0.25; // Slightly faster/smoother physics
        dot.x += (nextDot.x - dot.x) * ease;
        dot.y += (nextDot.y - dot.y) * ease;

        const line = linesRef.current[index];
        if (line) {
          gsap.set(line, {
            attr: {
              x1: nextDot.x,
              y1: nextDot.y,
              x2: dot.x,
              y2: dot.y,
            },
            // Tapering width and opacity

            strokeWidth: (count - index) * 0.05,
            opacity: (count - index) / count,
          });
        }
      });
    };

    gsap.ticker.add(update);
    return () => gsap.ticker.remove(update);
  }, []);

  return (
    <Box
      pointerEvents="none"
      position="fixed"
      inset={0}
      zIndex={999999}
      mixBlendMode="difference"
    >
      <svg width="100%" height="100%" style={{ overflow: "visible" }}>
        {Array.from({ length: 40 }).map((_, i) => (
          <line
            key={i}
            ref={(el: SVGLineElement | null) => {
              if (el) linesRef.current[i] = el;
            }}
            stroke="white"
            strokeLinecap="round"
          />
        ))}
      </svg>
    </Box>
  );
};

const FolderStackAnimation = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  const visualsRef = useRef<(HTMLDivElement | null)[]>([]);
  const labelsRef = useRef<(HTMLDivElement | null)[]>([]);
  const itemsCount = 30;

  const hoveredIndex = useRef<number | null>(null);
  const scrollProgress = useRef(0);
  const scrollTarget = useRef(0);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeMousePos = useRef({ x: 0, y: 0 });
  const introProgress = useRef({ val: 0 }); // Track intro animation state
  const cardWidth = 400;

  React.useEffect(() => {
    // Intro Animation: Animate the 'val' from 0 (Stacked Top-Right) to 1 (Normal Scroll Layout)
    gsap.to(introProgress.current, {
      val: 1,
      duration: 2.5,
      ease: "power4.out",
      delay: 0.2,
    });

    const handleWheel = (e: WheelEvent) => {
      // Adjust scroll speed here
      scrollTarget.current -= e.deltaY * 0.8;

      // Use GSAP for smoother momentum/inertia
      gsap.to(scrollProgress, {
        current: scrollTarget.current,
        duration: 0.01,
        ease: "power4.out",
        overwrite: true,
      });
    };
    window.addEventListener("wheel", handleWheel);
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  React.useEffect(() => {
    const update = () => {
      // Manual inertia removed; GSAP handles scrollProgress.current updates now
      // which results in much smoother physics.

      const spacing = 200; // Increased spacing for better separation
      const totalDist = itemsCount * spacing;
      const intro = introProgress.current.val; // 0 to 1

      itemsRef.current.forEach((item, index) => {
        const visualItem = visualsRef.current[index];
        if (!item || !visualItem) return;

        const rawPos = index * spacing + scrollProgress.current;
        const offset = (((rawPos % totalDist) + totalDist) % totalDist) * 1.1;
        const progress = offset / totalDist;

        // Base 3D Path (Gabriel Veres style)
        // Background (Top-Right) -> Foreground (Bottom-Left)
        const zBase = progress * 8500 - 6000;
        const xBase = (1 - progress) * 3600 - 1800;
        const yBase = progress * 2400 - 1200;

        // Target Scroll Positions
        const targetX = xBase + 100;
        const targetY = yBase;
        const targetZ = zBase;

        // Intro Spawn Point (Stacked Top Right)
        const spawnX = 3000;
        const spawnY = -2000;
        const spawnZ = -10000;

        // Interpolate based on intro progress
        // When intro=0, we are at Spawn. When intro=1, we are at Target.
        const x = spawnX + (targetX - spawnX) * intro;
        const y = spawnY + (targetY - spawnY) * intro;
        const z = spawnZ + (targetZ - spawnZ) * intro;

        // let filter = `brightness(${0.5 + progress * 0.5})`;
        let opacity = 1;

        // Edge Opacity Fade
        if (targetZ < -3000) opacity = (targetZ + 6000) / 3000;
        else if (targetZ > 1500) opacity = 1 - (targetZ - 1500) / 1000;
        opacity = Math.max(0, Math.min(0.8, opacity));

        // Fade in during intro as well
        opacity = opacity * intro;

        // Default: Wrapper is at Base. Visual is at 0,0,0 (Relative).
        const wrapperProps: gsap.TweenVars = {
          x: x,
          y: y - 80,
          z: z,
          rotateX: -24,
          rotateY: -25,
          rotateZ: 10,
          opacity: opacity,
          // filter: filter,
          zIndex: Math.floor(targetZ + 10000),
          duration: 0, // MUST be 0 to sync with scroll physics exactly
          ease: "power2.out",
          overwrite: "auto",
        };

        const visualProps: gsap.TweenVars = {
          x: 0,
          y: 0,
          z: 0,
          scale: 1,
          duration: 1, // Keep smooth transition for hover pop
          ease: "power2.out",
          overwrite: "auto",
        };

        // --- HOVER INTERACTION LOGIC ---
        if (hoveredIndex.current !== null && index === hoveredIndex.current) {
          // The Active Item Logic:
          // 1. Wrapper stays at Base (as the Ghost Hit Box).
          // 2. But we boost zIndex so visual renders on top.
          wrapperProps.zIndex = 100000;

          wrapperProps.opacity = 1;

          // 3. Visual Content Pops OUT relative to Wrapper
          visualProps.x = cardWidth;
          visualProps.y = 0;
          visualProps.z = 0; // Forward from the ghost plane
          visualProps.scale = 1.1;
          visualProps.ease = "back.out(1.7)"; // Snappy "magnetic pull" effect
        }

        // Animate Wrapper (Ghost + Container)
        // Using duration: 0 ensures it sticks to the calculated curve instantly
        gsap.to(item, wrapperProps);

        // Animate Visuals (Inner Content)
        gsap.to(visualItem, visualProps);

        // Animate Label
        const labelItem = labelsRef.current[index];
        if (labelItem) {
          if (hoveredIndex.current === index) {
            const mx = activeMousePos.current.x;
            const my = activeMousePos.current.y;

            // Just use mouse position directly
            const labelX = mx;
            const labelY = my;

            gsap.to(labelItem, {
              left: labelX,
              top: labelY + 20,
              opacity: 1, // Fade in
              duration: 0.1, // Very fast follow
              ease: "power1.out",
              overwrite: "auto",
            });
          } else {
            // Unhovered: Just fade out, don't reset position to avoid jump on next entry
            gsap.to(labelItem, {
              opacity: 0, // Fade out
              duration: 0.2,
              ease: "power2.out",
              overwrite: "auto",
            });
          }
        }
      });
    };

    gsap.ticker.add(update);
    return () => {
      gsap.ticker.remove(update);
    };
  }, []);

  return (
    <Box minH="100vh" w="full" bg="#050505" overflow="hidden" position="fixed">
      <CursorTrail />
      <Box
        ref={containerRef}
        className="container"
        w="100%"
        h="100vh"
        position="relative"
        sx={{
          perspective: "4000px", // Deep perspective
          transformStyle: "preserve-3d",
          pointerEvents: "none",
        }}
      >
        {Array.from({ length: itemsCount }).map((_, index) => (
          <Flex
            p={"4rem 2rem"}
            justifyContent={"center"}
            alignItems={"center"}
            key={index}
            ref={(el: HTMLDivElement | null) => {
              itemsRef.current[index] = el;
            }}
            className="folder-item-wrapper"
            position="absolute"
            pointerEvents="auto"
            top="50%"
            w={"85%"}
            left="50%"
            // bg={"red"}
            // Wrapper uses GSAP for positioning.
            // Initial transform to center it before GSAP takes over
            transform="translate(-50%, -50%) translateZ(-2000px)"
            zIndex={0}
            cursor="pointer"
            role="group"
            onMouseEnter={() => {
              // Clear any existing timeout to ensure only the latest hover intent is tracked
              if (hoverTimeout.current) clearTimeout(hoverTimeout.current);

              hoverTimeout.current = setTimeout(() => {
                hoveredIndex.current = index;
                // activeMousePos reset removed to prevent center-jump
              }, 100);
            }}
            onMouseMove={(e) => {
              if (hoveredIndex.current === index) {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                activeMousePos.current = { x, y };
              }
            }}
            onMouseLeave={() => {
              // If we leave before the timeout triggers, clear it so we don't hover
              if (hoverTimeout.current) {
                clearTimeout(hoverTimeout.current);
                hoverTimeout.current = null;
              }
              hoveredIndex.current = null;
              // activeMousePos reset removed
            }}
          >
            {/* Visual Content Group: moves relative to Wrapper */}
            <Box
              w={`${cardWidth + 100}px`} // Dimensions of the hit area (matches card)
              h={`${cardWidth}px`}
              className="visual-content"
              ref={(el: HTMLDivElement | null) => {
                visualsRef.current[index] = el;
              }}
              // w="100%"
              // h="100%"
              position="relative"
              // transformStyle essential if we had 3D children,
              // but here we just have flat card + label.
            >
              <Box
                w="100%"
                h="100%"
                overflow="hidden"
                rounded="sm"
                // Glassy Border & Glow
                boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.15), inset 0 0 30px rgba(255, 255, 255, 0.1)"
                border="1px solid rgba(255, 255, 255, 0.2)"
                bg="#1a1a1a"
                position="relative"
              >
                {/* Image */}
                <Image
                  src={`https://picsum.photos/id/${10 + index * 5}/800/600`}
                  alt={`Project ${index}`}
                  w="100%"
                  h="100%"
                  objectFit="cover"
                  draggable={false}
                  filter="brightness(0.9) contrast(1.2)"
                />
                {/* Stronger Glass Reflection Overlay */}
                <Box
                  position="absolute"
                  inset={0}
                  bg="linear-gradient(120deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, transparent 100%)"
                  pointerEvents="none"
                  mixBlendMode="overlay"
                />
              </Box>
              {/* Label moves with card */}
              <Box
                ref={(el: HTMLDivElement | null) => {
                  labelsRef.current[index] = el;
                }}
                position="absolute"
                bottom="-50px"
                left="20px"
                color="white"
                mixBlendMode="difference"
                pointerEvents="none"
                opacity={0}
                className="label"
                sx={{
                  ".folder-item-wrapper:hover &": {
                    opacity: 1,
                    // transform: "translateY(-10px)", // Removed to let GSAP handle position
                    // transition: "all 0.3s", // Removed to prevent conflict
                  },
                }}
              >
                <Box fontWeight="bold" fontSize="lg">
                  PROJECT {index + 1}
                </Box>
                <Box fontSize="sm" color="gray.400">
                  Interaction Design
                </Box>
              </Box>
            </Box>
          </Flex>
        ))}
      </Box>
    </Box>
  );
};

export default FolderStackAnimation;
