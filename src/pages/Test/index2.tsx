import { Button, Flex } from "@chakra-ui/react";
import React, { useRef } from "react";
import gsap from "gsap";

const Test2 = () => {
  const lineRef = useRef<SVGPathElement | null>(null);
  const ballRef = useRef<SVGCircleElement | null>(null);

  const springBack = () => {
    // Spring / elastic return
    gsap.to(lineRef.current, {
      attr: { d: "M 50 200 Q 300 200 550 200" },
      duration: 1.2,
      ease: "elastic.out(1, 0.35)",
    });
  };

  const bendLine = (intensity: number, speed: number) => {
    // Bend down based on intensity
    gsap.to(lineRef.current, {
      attr: { d: `M 50 200 Q 300 ${200 + intensity} 550 200` },
      duration: speed,
      ease: "power2.out",
      onComplete: springBack,
    });
  };

  const drop = () => {
    // Reset states
    gsap.set(ballRef.current, { attr: { cy: 20 } });
    gsap.set(lineRef.current, {
      attr: { d: "M 50 200 Q 300 200 550 200" },
    });

    const tl = gsap.timeline();
    let jumpHeight = 180;
    let duration = 0.5;

    // Initial fall
    tl.to(ballRef.current, {
      attr: { cy: 200 },
      duration: duration,
      ease: "power2.in",
      onComplete: bendLine,
      onCompleteParams: [60, 0.1],
    });

    // Bounces with reduced height each time
    for (let i = 0; i < 5; i++) {
      jumpHeight *= 0.55; // Decrease height
      duration *= 0.9; // animate slightly faster as smaller distance

      // Jump Up
      tl.to(ballRef.current, {
        attr: { cy: 200 - jumpHeight },
        duration: duration,
        ease: "power2.out",
      });

      // Fall Down
      tl.to(ballRef.current, {
        attr: { cy: 200 },
        duration: duration,
        ease: "power2.in",
        onComplete: bendLine,
        onCompleteParams: [jumpHeight * 0.4, 0.1], // Dynamic bend intensity
      });
    }
  };

  return (
    <Flex w="100%" h="100vh" bg="#000" align="center" justify="center">
      <Button onClick={drop}>drop</Button>
      <Flex
        w="600px"
        h="400px"
        align="center"
        justify="center"
        cursor="pointer"
      >
        <svg width="600" height="400">
          {/* Spring line */}
          <path
            ref={lineRef}
            d="M 50 200 Q 300 200 550 200"
            fill="none"
            stroke="white"
            strokeWidth="4"
          />

          {/* Falling object */}
          <circle ref={ballRef} cx="300" cy="20" r="12" fill="red" />
        </svg>
      </Flex>
    </Flex>
  );
};

export default Test2;
