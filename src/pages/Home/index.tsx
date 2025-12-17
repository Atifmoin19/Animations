import { Box, Flex, Image, Text } from "@chakra-ui/react";
import circular from "assets/circular.png";
import delayCircular from "assets/delayCircular.png";
import elasticPhysics from "assets/spring.png";
import layered from "assets/Layered.png";
import clothReveal from "assets/ClothReveal.png";
import fallingText from "assets/falling-text.png";
import CardFlying from "assets/CardFlying.png";
import particleShatter from "assets/PhysicsShatter.png";
import folderStack from "assets/folder.png";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// --- Futuristic Card Component ---
const RoboCard = ({
  data,
  onClick,
}: {
  data: { link: string; image: string; title: string };
  onClick: () => void;
}) => {
  return (
    <Box
      onClick={onClick}
      w="280px"
      h="350px"
      cursor="pointer"
      position="relative"
      role="group"
      // Glass/Robotic Base Style
      bg="rgba(10, 10, 10, 0.76)"
      backdropFilter="blur(10px)"
      border="1px solid rgba(0, 243, 255, 0.3)"
      boxShadow="0 0 15px rgba(0, 243, 255, 0.1)"
      transition="all 0.3s ease"
      _hover={{
        border: "1px solid rgba(0, 243, 255, 0.8)",
        boxShadow:
          "0 0 30px rgba(0, 243, 255, 0.4), inset 0 0 20px rgba(0, 243, 255, 0.2)",
        transform: "scale(1.05)",
      }}
      overflow="hidden"
      // Technical Corners (using pseudo elements or just CSS borders)
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        width: "20px",
        height: "20px",
        borderTop: "2px solid #00f3ff",
        borderLeft: "2px solid #00f3ff",
        transition: "all 0.3s ease",
      }}
      _after={{
        content: '""',
        position: "absolute",
        bottom: 0,
        right: 0,
        width: "20px",
        height: "20px",
        borderBottom: "2px solid #00f3ff",
        borderRight: "2px solid #00f3ff",
        transition: "all 0.3s ease",
      }}
    >
      <Flex
        direction="column"
        h="100%"
        p={4}
        align="center"
        justify="space-between"
      >
        {/* Holographic Image Container */}
        <Box
          w="100%"
          h="70%"
          overflow="hidden"
          position="relative"
          borderBottom="1px solid rgba(0,243,255,0.2)"
        >
          <Image
            src={data.image}
            w="100%"
            h="100%"
            objectFit="cover"
            filter="hue-rotate(180deg) contrast(2) brightness(.)" // Techie filter
            opacity={0.8}
            _groupHover={{
              opacity: 1,
              filter: "contrast(1.2) brightness(1)",
            }}
            transition="all 0.4s ease"
          />
          {/* Scanline overlay */}
          <Box
            position="absolute"
            top={0}
            left={0}
            w="100%"
            h="100%"
            bg="linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))"
            backgroundSize="100% 2px, 3px 100%"
            pointerEvents="none"
          />
        </Box>

        {/* Text Area */}
        <Flex
          direction="column"
          align="center"
          justify="center"
          h="30%"
          w="100%"
        >
          <Text
            color="#00f3ff"
            fontFamily="monospace"
            fontWeight="bold"
            fontSize="lg"
            textShadow="0 0 5px rgba(0, 243, 255, 0.7)"
            textAlign="center"
          >
            {data.title.toUpperCase()}
          </Text>
          <Text
            color="rgba(255,255,255,0.5)"
            fontSize="xs"
            fontFamily="monospace"
            mt={1}
            letterSpacing="2px"
          >
            SYSTEM_ACTIVE
          </Text>
        </Flex>
      </Flex>
    </Box>
  );
};

// --- Main 3D Cylinder Page ---
const HomePage = () => {
  const navigate = useNavigate();
  const carouselRef = useRef<HTMLDivElement>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);

  const cardData = [
    {
      link: "/circular-animation",
      image: circular,
      title: "Circular",
    },
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
    {
      link: "/layered-interface",
      image: layered,
      title: "Layered UI",
    },
    {
      link: "/spring-bounce",
      image: elasticPhysics,
      title: "Spring Physics",
    },
    {
      link: "/physics-shatter",
      image: particleShatter,
      title: "Shatter",
    },
    {
      link: "/falling-text",
      image: fallingText,
      title: "Kinetic Type",
    },
    {
      link: "/cloth-reveal",
      image: clothReveal,
      title: "Cloth Reveal",
    },
    {
      link: "/card-scroll-trigger",
      image: folderStack,
      title: "Scroll Fly",
    },
    {
      link: "/card-scroll-trigger",
      image: CardFlying,
      title: "Scroll Fly",
    },
  ];

  // Config
  const RADIUS = 400; // Push them out
  const TOTAL_CARDS = cardData.length;
  const ANGLE_STEP = 360 / TOTAL_CARDS;

  useEffect(() => {
    // Continuous rotation
    if (carouselRef.current) {
      // Create the tween
      tweenRef.current = gsap.to(carouselRef.current, {
        rotationY: "-=360", // Rotate counter-clockwise (so items move left-to-right)
        duration: 20,
        repeat: -1,
        ease: "none",
      });
    }

    return () => {
      tweenRef.current?.kill();
    };
  }, []);

  const handleMouseEnter = () => {
    tweenRef.current?.pause();
    // Optional: Animate opacity or scale of background elements
    gsap.to(carouselRef.current, {
      scale: 1.05,
      duration: 0.5,
      ease: "power2.out",
    });
  };

  const handleMouseLeave = () => {
    tweenRef.current?.play();
    gsap.to(carouselRef.current, {
      scale: 1,
      duration: 0.5,
      ease: "power2.out",
    });
  };

  return (
    <Flex
      w="100vw"
      h="100vh"
      bg="#050505"
      align="center"
      justify="center"
      overflow="hidden"
      style={{ perspective: "1200px" }} // Creates the 3D depth
      // Subtle Grid Background
      backgroundImage="linear-gradient(rgba(0, 243, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.03) 1px, transparent 1px)"
      backgroundSize="40px 40px"
    >
      {/* Ambient Glow */}
      <Box
        position="absolute"
        w="600px"
        h="600px"
        bg="radial-gradient(circle, rgba(0, 242, 255, 0.4) 0%, transparent 50%)"
        pointerEvents="none"
        style={{ mixBlendMode: "screen" }}
      />

      {/* 3D Carousel Container */}
      <Box
        ref={carouselRef}
        position="relative"
        w="0px" // Center point
        h="0px"
        style={{ transformStyle: "preserve-3d" }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {cardData.map((card, index) => {
          const angle = index * ANGLE_STEP;
          return (
            <Box
              key={index}
              position="absolute"
              // Center the card on its pivot
              top="-175px" // half of height (350)
              left="-140px" // half of width (280)
              style={{
                transform: `rotateY(${angle}deg) translateZ(${RADIUS}px)`,
              }}
            >
              <RoboCard data={card} onClick={() => navigate(card.link)} />
            </Box>
          );
        })}
      </Box>

      {/* Futuristic Title Overlay */}
      <Box position="absolute" top="10%" textAlign="center">
        <Text
          color="white"
          fontSize="4xl"
          fontWeight="bold"
          fontFamily="Orbitron, monospace" // Fallback to monospace if Orbitron not loaded
          letterSpacing="10px"
          textShadow="0 0 10px rgba(0, 243, 255, 0.8)"
        >
          ARCHIVES
        </Text>
        <Box
          w="100px"
          h="2px"
          bg="#00f3ff"
          mx="auto"
          mt={2}
          boxShadow="0 0 10px #00f3ff"
        />
      </Box>
    </Flex>
  );
};

export default HomePage;
