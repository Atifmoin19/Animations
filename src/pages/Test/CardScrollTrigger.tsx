import { Flex, Box } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import RoboticWrapper from "../../components/RoboticWrapper";

gsap.registerPlugin(ScrollTrigger);

const CardScrollTrigger = () => {
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clean up potentially stale refs
    cardsRef.current = cardsRef.current.slice(0, 20);

    const scroller = containerRef.current;

    cardsRef.current.forEach((card, index) => {
      if (!card || !scroller) return;

      // Reset any previous GSAP state
      gsap.set(card, { clearProps: "all" });

      const isLeft = index % 2 === 0;

      // New Animation: Opacity + Rotate + Scrub
      // "Coming from rotated mode to normal"
      gsap.from(card, {
        opacity: 0,
        rotation: isLeft ? 45 : -45, // Rotate from an angle
        y: 400, // Move from slightly below
        x: isLeft ? -1050 : 1050, // Move from slightly below
        scale: 0.2, // Start slightly smaller
        transformOrigin: isLeft ? "top right" : "top left",
        ease: "power1.out",
        scrollTrigger: {
          trigger: card,
          scroller: scroller, // Important since we are in a custom scroll container
          start: "top 100%", // Start as soon as top of card hits bottom of viewport
          end: "top 80%", // End when top of card hits 40% up the viewport
          scrub: 0.7, // Smooth scrubbing (0.5s - 1s lag)
        },
      });
    });

    // Cleanup function to kill ScrollTriggers on unmount
    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <RoboticWrapper
      title="GSAP Flying Cards"
      description="Scroll to see cards fly in"
    >
      {/* Scrollable Container */}
      <Box
        ref={containerRef}
        h="100%"
        mt={"8rem"}
        overflowY="auto"
        overflowX="hidden"
        css={{
          "&::-webkit-scrollbar": { width: "4px" },
          "&::-webkit-scrollbar-track": { background: "transparent" },
          "&::-webkit-scrollbar-thumb": {
            background: "#00f3ff",
            borderRadius: "2px",
          },
        }}
      >
        {/* Intro Section - Approx 50vh height */}
        <Flex
          h="20vh"
          direction="column"
          align="center"
          justify="center"
          textAlign="center"
          mb={10}
          px={4}
        >
          <Box
            fontSize="5xl"
            fontWeight="bold"
            bgGradient="linear(to-r, cyan.400, purple.500)"
            bgClip="text"
            mb={4}
          >
            Flying Elements
          </Box>
          <Box fontSize="xl" color="gray.400" maxW="600px">
            Experience a dynamic grid where elements fly into place from all
            directions as you explore. Designed for high-impact visual
            engagement.
          </Box>
        </Flex>

        {/* Cards Grid */}
        <Flex wrap="wrap" gap={6} px={4} pb={"10rem"} justify="center">
          {Array.from({ length: 20 }).map((_, index) => (
            <Box
              key={index}
              ref={(el) => {
                cardsRef.current[index] = el;
              }}
              w={{ base: "100%", md: "calc(50% - 12px)" }} // 50% width minus half gap
              h="45vh" // Height sized to fit roughly 2 rows in the viewport
              bg="teal.400"
              borderRadius="lg"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="3xl"
              fontWeight="bold"
              color="white"
              boxShadow="xl"
              border="1px solid rgba(255,255,255,0.1)"
              _hover={{
                bg: "teal.500",
                transform: "scale(1.02)",
                transition: "all 0.2s",
                borderColor: "cyan.400",
                boxShadow: "0 0 20px cyan",
              }}
            >
              Card {index + 1}
            </Box>
          ))}
        </Flex>
      </Box>
    </RoboticWrapper>
  );
};

export default CardScrollTrigger;
