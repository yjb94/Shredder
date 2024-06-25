import {
  Box,
  Canvas,
  Circle,
  Group,
  Image,
  ImageShader,
  Rect,
  SkRect,
  Vertices,
  rect,
  rrect,
  useImage,
  useTouchHandler,
  vec,
} from "@shopify/react-native-skia";
import React, { useState } from "react";
import {
  SharedValue,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { createNoise2D } from "./SimpleNoise";
import {
  NUMBER_OF_STRIPES,
  photo,
  pictureRect,
  stripes,
  windowHeight,
  windowWidth,
} from "./const";
import { generateTrianglePointsAndIndices } from "./utils";

const START_Y = 30 as const;

const SHREDDER_HEIGHT = 100;
const SHREDDER_KNIFE_POSITION = SHREDDER_HEIGHT - 30;
const shredderY = windowHeight / 2 - SHREDDER_HEIGHT / 2;

export const ShredStripes = () => {
  const picture = useImage(photo);

  const y = useSharedValue<number>(START_Y);
  const offset = useSharedValue(0);

  const [isStripeCropped, setIsStripeCropped] = useState(false);

  const onTouch = useTouchHandler({
    onStart: (event) => {
      offset.value = y.value - event.y;
    },
    onActive: (event) => {
      const newY = offset.value + event.y;
      if (newY > y.value && newY < windowHeight - pictureRect.height) {
        y.value = newY;
      }
    },
    onEnd: () => {
      setIsStripeCropped(true);
      y.value = withTiming(windowHeight + 200, {
        duration: 2000,
      });
    },
  });

  const transform = useDerivedValue(() => {
    return [
      {
        translateX: windowWidth / 4,
      },
      { translateY: y.value },
    ];
  }, [y]);

  const topRect = useDerivedValue(() => {
    return rect(0, 0, windowWidth, y.value);
  }, [y]);

  const bottomRect = useDerivedValue(() => {
    return rect(0, y.value, windowWidth, shredderY);
  }, [y]);

  if (!picture) {
    return null;
  }

  return (
    <>
      <Canvas
        style={{
          flex: 1,
        }}
        onTouch={onTouch}
      >
        <Group>
          <Box
            box={rrect(
              rect(5, shredderY, windowWidth - 10, SHREDDER_HEIGHT),
              12,
              12
            )}
            color="rgb(66,72,73)"
          />
          <Rect
            rect={rect(
              25,
              shredderY + SHREDDER_KNIFE_POSITION,
              windowWidth - 50,
              5
            )}
            color="rgb(47,52,59)"
          />
        </Group>

        <Group clip={rect(0, shredderY, windowWidth, windowHeight)}>
          <Group transform={transform}>
            <ImageShader image={picture} rect={pictureRect} fit="fill" />
            {stripes.map((stripe, i) => {
              return (
                <Stripe
                  key={i}
                  stripe={stripe}
                  i={i}
                  y={y}
                  isCroped={isStripeCropped}
                />
              );
            })}
          </Group>
        </Group>
        <Group>
          <Box
            box={rrect(
              rect(5, shredderY, windowWidth - 10, SHREDDER_KNIFE_POSITION),
              12,
              12
            )}
            color="rgb(66,72,73)"
          />
          <Circle c={vec(33, shredderY + 25)} r={8} color="white" />
          <Circle
            c={vec(61, shredderY + 25)}
            r={8}
            color="rgb(248, 230, 167)"
          />
        </Group>

        <Group clip={rect(0, 0, windowWidth, shredderY)}>
          <Group transform={transform}>
            <Image image={picture} rect={pictureRect} />
          </Group>
        </Group>
      </Canvas>
    </>
  );
};

type StripeProps = {
  stripe: SkRect;
  y: SharedValue<number>;
  i: number;
  isCroped: boolean;
};

const Stripe: React.FC<StripeProps> = ({ stripe, y, i: stripeIndex }) => {
  let { vertices, textures, indices } = generateTrianglePointsAndIndices(
    stripe,
    NUMBER_OF_STRIPES
  );

  const noise = createNoise2D();

  const animatedVertices = useDerivedValue(() => {
    return vertices.map((vertex, vertexIndex) => {
      const amplitude = 3;
      const frequency = 0.01;

      const delta = amplitude * noise(vertexIndex, frequency * y.value);

      return vec(vertex.x + delta, vertex.y + delta);
    });
  }, [y, stripeIndex]);

  return (
    <>
      <Vertices
        vertices={animatedVertices}
        textures={textures}
        indices={indices}
      />
      {/* <Skeleton vertices={animatedVertices} indices={indices} /> */}
    </>
  );
};
