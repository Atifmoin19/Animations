import { Flex, Box } from "@chakra-ui/react";
import React, { useRef, useEffect } from "react";
import gsap from "gsap";

const Test = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<HTMLDivElement[]>([]);

  const layerCount = 6;
  // Create an array of indices [0, 1, ..., 5]
  const layers = Array.from({ length: layerCount }, (_, i) => i);

  useEffect(() => {
    // Initial setup: Define base state with fixed rotation and scale hierarchy
    gsap.set(layersRef.current, {
      rotationX: 0,
      rotationZ: 0,
      rotation: 0,
    });
  }, []);

  const handleMouseEnter = () => {
    // 1. All properties EXCEPT x
    gsap.to(layersRef.current, {
      duration: 0.1,
      rotationX: 60,
      rotationZ: 0,

      scale: (i) => 1 - i * 0.1, // Maintain size hierarchy
      rotationY: 0,

      ease: "elastic.out(1, 0.8)",
      overwrite: "auto",
    });

    // 2. Only X with the specific delay
    gsap.to(layersRef.current, {
      duration: 0.2,
      stagger: {
        amount: 0.3,
        from: "start",
        grid: "auto",
        ease: "power2.out",
      },
      y: (i) => -i * 20,
      delay: 0.2,
      ease: "elastic.out(1, 0.8)",
    });
    gsap.to(layersRef.current, {
      duration: 0.2,
      stagger: {
        amount: 0.3,
        from: "start",
        grid: "auto",
        ease: "power2.out",
      },
      y: (i) => i * 20,
      delay: 0.4,
      ease: "elastic.out(1, 0.8)",
    });
    gsap.to(layersRef.current, {
      duration: 0.2,
      stagger: {
        amount: 0.3,
        from: "start",
        grid: "auto",
        ease: "power2.out",
      },
      y: (i) => -i * 30,
      delay: 0.6,
      ease: "elastic.out(1, 0.8)",
    });
  };

  const handleMouseLeave = () => {
    // Collapse Z, maintain rotation and scale
    gsap.to(layersRef.current, {
      duration: 0,
      scale: 1, // Maintain size hierarchy
      x: 0,
      y: 0,
      z: 0,
      rotationX: 0,
      rotationZ: 0,
      rotationY: 0,
      stagger: {
        amount: 0.02,
        from: "end",
        ease: "power2.inOut",
      },
      ease: "power3.out",
      overwrite: "auto",
    });
  };

  return (
    <Flex
      w={"100%"}
      h={"100vh"}
      bg={"#000"}
      direction={"column"}
      justifyContent={"center"}
      alignItems={"center"}
    >
      <Flex
        ref={containerRef}
        w={"400px"}
        h={"400px"}
        rounded={"xl"}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        sx={{
          perspective: "1000px", // Deep perspective
          transformStyle: "preserve-3d",
          cursor: "pointer",
        }}
        justifyContent={"center"}
        alignItems={"center"}
        position="relative"
      >
        {layers.map((i) => {
          // Bottommost (i=0) -> Opacity 0.9
          // Topmost (i=5) -> Opacity 0.2
          // Map range [0, layerCount-1] to [0.9, 0.2]
          const opacity = 0.8 - (i / (layerCount - 1)) * 0.7;

          return (
            <Box
              key={i}
              ref={(el) => {
                if (el) layersRef.current[i] = el;
              }}
              w={"300px"}
              h={"300px"}
              aspectRatio={"1/1"}
              bg={`rgba(255, 255, 255, ${opacity})`}
              rounded={"full"}
              position="absolute"
              sx={{
                // Base rotation from user request: "rotate Z and Y and x"
                // We apply this to the layers or the container?
                // Creating a tilted base state for the 'water' look
                transformStyle: "preserve-3d",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 0 20px rgba(255,255,255,0.1)",
              }}
            />
          );
        })}
      </Flex>
    </Flex>
  );
};

export default Test;
