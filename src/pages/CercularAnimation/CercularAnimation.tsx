import { Box, Flex, Image } from "@chakra-ui/react";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import RoboticWrapper from "../../components/RoboticWrapper";

export default function CercularAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const items = container.querySelectorAll(".item");
    const numberOfItems = items.length;
    const angleIncrement = (2 * Math.PI) / numberOfItems;
    const radius = 300;
    let isGalleryOpen = false;

    // We need the container dimensions.
    const centerX = container.offsetWidth / 2;
    const centerY = container.offsetHeight / 2;

    const tl = gsap.timeline();

    items.forEach((itemNode, index) => {
      const item = itemNode as HTMLElement;
      const angle = index * angleIncrement;
      const initialRotation = angle * (180 / Math.PI) - 90;

      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);

      gsap.set(item, { scale: 0, xPercent: -50, yPercent: -50 });

      tl.to(
        item,
        {
          left: x + "px",
          top: y + "px",
          rotation: initialRotation,
          scale: 1,
          duration: 1,
          ease: "power3.out",
          delay: 0.1,
        },
        index * 0.1
      );

      const handleItemClick = () => {
        if (isGalleryOpen) return;
        isGalleryOpen = true;

        const duplicate = item.cloneNode(true) as HTMLElement;
        duplicate.style.position = "absolute";
        container.appendChild(duplicate);

        gsap.to(
          Array.from(items).filter((i) => i != item),
          { scale: 0, duration: 0.5, ease: "power2.in", stagger: 0.05 }
        );

        const endRotation =
          initialRotation > 180 ? initialRotation - 360 : initialRotation;

        gsap.to([item, duplicate], {
          rotation: endRotation,
          duration: 0.0001,
          onComplete: function () {
            gsap.to([item, duplicate], {
              left: "50%",
              top: "50%",
              xPercent: -50,
              yPercent: -50,
              scale: 5,
              rotation: 0,
              duration: 1,
              ease: "power2.out",
              delay: 1.25,
            });
          },
        });

        const closeGallery = () => {
          if (!isGalleryOpen) return;

          gsap.to([item, duplicate], {
            left: x + "px",
            top: y + "px",
            xPercent: -50, // Restore centering
            yPercent: -50, // Restore centering
            scale: 1,
            rotation: initialRotation,
            duration: 1,
            ease: "power2.out",
            onComplete: function () {
              duplicate.remove();
              gsap.to(items, {
                scale: 1,
                opacity: 1,
                duration: 1,
                stagger: 0.05,
                ease: "power2.out",
              });
              isGalleryOpen = false;
            },
          });
        };

        // Add close listeners
        item.addEventListener("click", closeGallery);
        duplicate.addEventListener("click", closeGallery);
      };

      item.addEventListener("click", handleItemClick);

      // Store the handler on the element to clean up later if needed,
      // or just rely on the main useEffect cleanup to not matter as component unmounts.
      (item as any)._clickHandler = handleItemClick;
    });

    return () => {
      tl.kill();
      // Cleanup event listeners
      items.forEach((itemNode) => {
        const item = itemNode as HTMLElement;
        if ((item as any)._clickHandler) {
          item.removeEventListener("click", (item as any)._clickHandler);
        }
      });
    };
  }, []);

  return (
    <RoboticWrapper
      title="CIRCULAR GALLERY"
      description="A dynamic circular distribution of interactive image nodes."
    >
      <Flex
        minH="100vh"
        w="full"
        align="center"
        justify="center"
        bg="transparent"
      >
        <Box
          className="container"
          ref={containerRef}
          w="full"
          h="100vh"
          position="relative"
          overflow="hidden"
        >
          <Box className="gallery">
            {new Array(16).fill(0).map((_, index) => (
              <Box
                key={index}
                className="item"
                position="absolute"
                top="50%"
                left="50%"
                transform="none"
                w="70px"
                h="100px"
                bg="#b0b0b0"
                m="10px"
              >
                <Image
                  src={`https://picsum.photos/id/${100 + index}/200/300`}
                  w="100%"
                  h="100%"
                  objectFit="cover"
                  pointerEvents="none" // Prevent image stealing clicks
                />
              </Box>
            ))}
          </Box>
        </Box>
      </Flex>
    </RoboticWrapper>
  );
}
