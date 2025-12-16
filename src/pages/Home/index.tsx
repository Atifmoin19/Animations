import { Box, Flex, Image, Link, Text } from "@chakra-ui/react";
import circular from "assets/circular.png";
import delayCircular from "assets/delayCircular.png";
import folderStack from "assets/folder.png";

const AnimationCards = (props: {
  cardData: { link: string; image: string; title: string };
}) => {
  return (
    <Flex w={"300px"} h={"300px"} rounded={"xl"}>
      <Box
        w="100%"
        h="100%"
        overflow="hidden"
        _hover={{ transform: "scale(1.1)" }}
        transition="transform 0.3s ease"
        rounded={"xl"}
        // Glassy Border & Glow
        boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.15), inset 0 0 30px rgba(255, 255, 255, 0.1)"
        border="1px solid rgba(255, 255, 255, 0.2)"
        bg="#1a1a1a"
        position="relative"
      >
        <Image
          src={props.cardData.image}
          w="100%"
          h="100%"
          objectFit="cover"
          draggable={false}
          filter="brightness(0.9) contrast(1.2)"
        />
      </Box>
    </Flex>
  );
};
const HomePage = () => {
  const cardData = [
    {
      link: "/circular-animation",
      image: circular,
      title: "Circular Animation",
    },
    {
      link: "/delay-circular-animation",
      image: delayCircular,
      title: "Delay Circular Animation",
    },
    {
      link: "/folder-stack-animation",
      image: folderStack,
      title: "Folder Stack Animation",
    },
  ];
  return (
    <Flex
      w={"100%"}
      h={"100vh"}
      direction={"column"}
      gap={"2rem"}
      justifyContent={"center"}
      alignItems={"center"}
    >
      <Text fontSize={"3xl"} fontWeight={"bold"} letterSpacing={"3px"}>
        Animations
      </Text>
      <Flex gap={"2rem"}>
        {cardData.map((card) => (
          <Link key={card.title} href={card.link}>
            <AnimationCards cardData={card} />
          </Link>
        ))}
      </Flex>
    </Flex>
  );
};

export default HomePage;
