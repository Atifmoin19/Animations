import { Box, Flex, Text, Image } from "@chakra-ui/react";
import gsap from "gsap";
import { CustomEase, Flip } from "gsap/all";
import { useLayoutEffect, useRef } from "react";
import "../../index.css";

// Register GSAP plugins
gsap.registerPlugin(CustomEase, Flip);

const DelayCercularAnimation = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLParagraphElement>(null);

  const itemsCount = 30;

  useLayoutEffect(() => {
    if (!containerRef.current || !galleryRef.current || !counterRef.current)
      return;

    const container = containerRef.current;
    const gallery = galleryRef.current;
    const counterElement = counterRef.current;

    // Create Custom Ease
    CustomEase.create(
      "hop",
      "M0,0 C0.53,0.604 0.157,0.72 0.293,0.837 0.435,0.959 0.633,1 1,1"
    );

    // Initial Linear Layout Setup
    const setInitialLinearLayout = () => {
      const items = gallery.querySelectorAll(".item");
      if (items.length === 0) return;

      const itemWidth = (items[0] as HTMLElement).offsetWidth || 175; // Fallback to CSS width
      const totalItemsWidth = (items.length - 1) * 10 + itemWidth;
      const startX = (container.offsetWidth - totalItemsWidth) / 2;

      items.forEach((item, index) => {
        gsap.set(item, {
          left: `${startX + index * 10}px`,
          top: "150%",
          rotation: 0,
        });
      });

      gsap.to(items, {
        top: "50%",
        yPercent: -50, // properly centers element on Y axis
        duration: 1,
        ease: "hop",
        stagger: 0.02,
      });
    };

    // Circular Layout Calculation
    const setCircularLayout = () => {
      const items = gallery.querySelectorAll(".item");
      const angleIncrement = (2 * Math.PI) / itemsCount;
      const radius = 200;
      const centerX = container.offsetWidth / 2;
      const centerY = container.offsetHeight / 2;

      items.forEach((item, index) => {
        const angle = index * angleIncrement;
        const x =
          centerX +
          radius * Math.cos(angle) -
          (item as HTMLElement).offsetWidth / 2;
        const y =
          centerY +
          radius * Math.sin(angle) -
          (item as HTMLElement).offsetHeight / 2;

        gsap.set(item, {
          left: x + "px",
          top: y + "px",
          rotation: angle * (180 / Math.PI) - 90,
          yPercent: 0, // Reset yPercent used in linear layout
          xPercent: 0,
        });
      });
    };

    // Transition Animation
    const animateToCircularLayout = () => {
      const items = gallery.querySelectorAll(".item");
      const state = Flip.getState(items);

      setCircularLayout();

      Flip.from(state, {
        duration: 2,
        ease: "hop",
        stagger: -0.03,
        // Using onUpdate or standard props to handle rotation smoothly if needed
        // Flip handles rotation if captured in state difference
        absolute: true, // Ensure absolute positioning is handled correctly
      });
    };

    // Counter Animation
    const animateCounter = () => {
      let currentValue = 0;
      const updateInterval = 50; // Faster updates for smooth counting
      const maxDuration = 1500;
      const endValue = 100;
      const startTime = Date.now();

      const updateCounter = () => {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < maxDuration) {
          currentValue = Math.min(
            Math.floor((elapsedTime / maxDuration) * endValue),
            endValue
          );

          counterElement.textContent = currentValue.toString();
          setTimeout(updateCounter, updateInterval);
        } else {
          counterElement.textContent = endValue.toString();

          // Animate counter out and trigger layout change
          setTimeout(() => {
            gsap.to(counterElement, {
              y: 20,
              opacity: 0,
              duration: 1,
              ease: "power3.inOut",
              onComplete: () => {
                animateToCircularLayout();
              },
            });
          }, 100);
        }
      };

      updateCounter();
    };

    // Start Sequence
    const ctx = gsap.context(() => {
      const initAnimation = () => {
        // Initialize positions
        setInitialLinearLayout();

        // Reveal Loader
        gsap.to(counterElement, {
          y: 0,
          duration: 0.2,
          ease: "power3.out",
          delay: 0,
          onComplete: animateCounter,
        });
      };

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initAnimation);
      } else {
        // If the document is already ready (which is common in SPAs), run immediately
        initAnimation();
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <Flex minH="100vh" w="full" align="center" justify="center" bg="beige">
      <Box
        ref={containerRef}
        className="container"
        w="100%"
        h="100vh"
        position="relative"
        overflow="hidden"
      >
        <Box ref={galleryRef} w="100%" h="100%" className="gallery">
          {/* Render items using React map instead of manual DOM creation */}
          {Array.from({ length: itemsCount }).map((_, index) => (
            <Box
              key={index}
              className="item"
              position="absolute"
              top="150%" // Initial position off-screen
              w="175px"
              h="250px"
            >
              <Image
                rounded={"2xl"}
                shadow={"md"}
                bg={"#b0b0b0"}
                src={`https://picsum.photos/id/${100 + index + 1}/200/300`}
                alt={`Image ${index + 1}`}
                w="100%"
                h="100%"
                objectFit="cover"
                loading="eager"
              />
            </Box>
          ))}
        </Box>

        <Box
          className="loader"
          position="absolute"
          bottom="15%"
          left="50%"
          transform="translate(-50%, -50%)"
          w="40px"
          textAlign="center"
          clipPath="polygon(0 0,100% 0,100% 100%,0 100%)"
        >
          <Text
            ref={counterRef}
            position="relative"
            display="flex"
            justifyContent="center"
            transform="translateY(20px)"
            fontWeight="bold"
            fontSize="xl"
          >
            0
          </Text>
        </Box>
      </Box>
    </Flex>
  );
};

export default DelayCercularAnimation;
