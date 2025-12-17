import { Box, Flex, Text, Button } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

interface RoboticWrapperProps {
  title: string;
  description: string;
  children: React.ReactNode;
  noBg?: boolean; // If the child already has a complex bg
}

const RoboticWrapper = ({
  title,
  description,
  children,
  noBg = false,
}: RoboticWrapperProps) => {
  const navigate = useNavigate();

  return (
    <Box
      w="100vw"
      h="100vh"
      position="relative"
      overflow="hidden"
      bg={noBg ? "transparent" : "#050505"}
    >
      {/* Background Elements (if needed) */}
      {!noBg && (
        <>
          <Box
            position="absolute"
            inset={0}
            zIndex={0}
            backgroundImage="linear-gradient(rgba(0, 243, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 243, 255, 0.03) 1px, transparent 1px)"
            backgroundSize="40px 40px"
            pointerEvents="none"
          />
          <Box
            position="absolute"
            w="100%"
            h="100%"
            bg="radial-gradient(circle, rgba(0, 243, 255, 0.1) 0%, transparent 60%)"
            pointerEvents="none"
            style={{ mixBlendMode: "screen" }}
          />
        </>
      )}

      {/* Content Container - Ensure it takes full space */}
      <Box position="absolute" inset={0} zIndex={1}>
        {children}
      </Box>

      {/* UI Overlay (Title, Desc, Back) */}
      <Box
        position="absolute"
        top={0}
        left={0}
        w="100%"
        p={8}
        zIndex={10}
        pointerEvents="none"
      >
        <Flex justify="space-between" align="flex-start">
          <Box pointerEvents="auto">
            <Text
              color="white"
              fontSize="4xl"
              fontWeight="bold"
              fontFamily="Orbitron, monospace" // Fallback
              letterSpacing="4px"
              textShadow="0 0 10px rgba(0, 243, 255, 0.8)"
            >
              {title.toUpperCase()}
            </Text>
            <Box
              w="60px"
              h="2px"
              bg="#00f3ff"
              mt={2}
              mb={4}
              boxShadow="0 0 10px #00f3ff"
            />
            <Text
              color="rgba(255,255,255,0.7)"
              fontSize="sm"
              maxW="400px"
              fontFamily="monospace"
            >
              {description}
            </Text>
          </Box>

          <Button
            pointerEvents="auto"
            variant="outline"
            color="#00f3ff"
            borderColor="#00f3ff"
            _hover={{ bg: "rgba(0, 243, 255, 0.1)" }}
            onClick={() => navigate("/")}
            size="sm"
            rounded="none"
            leftIcon={<span style={{ fontSize: "1.2em" }}>«</span>}
          >
            RETURN
          </Button>
        </Flex>
      </Box>

      {/* Footer Deco */}
      <Box
        position="absolute"
        bottom={4}
        right={8}
        zIndex={10}
        pointerEvents="none"
      >
        <Text
          color="rgba(255,255,255,0.3)"
          fontSize="xs"
          fontFamily="monospace"
        >
          SYSTEM_STATUS: ACTIVE // RENDER_MODE: 3D
        </Text>
      </Box>
    </Box>
  );
};

export default RoboticWrapper;
