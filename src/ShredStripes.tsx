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
  shredderY,
  stripes,
  windowHeight,
  windowWidth,
} from "./const";
import { generateTrianglePointsAndIndices } from "./utils";
import { Skeleton } from "./Skeleton";
import ShredderBack from "./ShredderBack";
import ShredderHead from "./ShredderHead";

const START_Y = 30 as const;

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
        <ShredderBack />

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

        <ShredderHead />

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
