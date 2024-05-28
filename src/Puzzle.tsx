import {
  Canvas,
  Circle,
  Group,
  Image,
  ImageShader,
  Rect,
  SkRect,
  Vector,
  Vertices,
  rect,
  useClock,
  useImage,
  vec,
} from "@shopify/react-native-skia";
import React, { useDebugValue, useEffect } from "react";
import { Button, Dimensions, useWindowDimensions } from "react-native";
import Animated, {
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Skeleton } from "./Skeleton";

export const Puzzle = () => {
  const picture = useImage(require("./assets/art1.jpg"));
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const stripeInterval = useSharedValue(0);
  const clock = useClock();

  if (!picture) {
    return null;
  }

  const pictureRatio = picture.width() / picture.height();

  const pictureRect = rect(
    0,
    0,
    windowWidth / 2,
    windowWidth / 2 / pictureRatio
  );

  const numberOfStripes = 20;
  const rects = Array.from({ length: numberOfStripes }, (_, i) => {
    const stripeWidth = windowWidth / 2 / numberOfStripes;
    const stripeHeight = windowWidth / 2 / pictureRatio;
    return rect(i * stripeWidth, 0, stripeWidth, stripeHeight);
  });

  const shred = () => {
    stripeInterval.value = withTiming(3, { duration: 1000 });
  };

  return (
    <>
      <Canvas
        style={{
          flex: 1,
          backgroundColor: "grey",
        }}
      >
        <Group
          transform={[
            {
              translateX:
                windowWidth / 4 - (stripeInterval.value * numberOfStripes) / 2,
            },
            { translateY: windowHeight / 4 },
          ]}
        >
          <ImageShader image={picture} rect={pictureRect} fit="fill" />
          {rects.map((rect, i) => {
            return (
              <Stripe
                key={i}
                index={i}
                rect={rect}
                numberOfStripes={numberOfStripes}
              />
            );
          })}
        </Group>
      </Canvas>
      <Button title="Next" onPress={shred} />
    </>
  );
};

interface StripeProps {
  rect: SkRect;
  index: number;
  numberOfStripes: number;
}

const ANIMATION_DURATION = 1500;
const ANIMATION_DELAY = 1000;

export const Stripe = ({ index, rect, numberOfStripes }: StripeProps) => {
  const { vertices, indices, textures } = generateTrianglePointsAndIndices(
    rect,
    20
  );

  const dy = useSharedValue(0);
  const dx = useSharedValue(0);

  useEffect(() => {
    if (index % 2 === 1) {
      pullDown();
      setTimeout(() => {
        pullUp();
        pullRight();
      }, ANIMATION_DURATION + ANIMATION_DELAY);
    } else {
      setTimeout(() => {
        pullLeft();
      }, ANIMATION_DURATION + ANIMATION_DELAY);
    }
  }, []);

  const pullDown = () => {
    dy.value = withTiming(rect.height / 2, { duration: ANIMATION_DURATION });
  };
  const pullUp = () => {
    dy.value = withTiming(0, { duration: ANIMATION_DURATION });
  };
  const pullLeft = () => {
    dx.value = withTiming(Math.floor(index / 2) * -rect.width, {
      duration: ANIMATION_DURATION,
    });
  };
  const pullRight = () => {
    dx.value = withTiming(
      rect.width * (Math.floor(numberOfStripes / 2) - 1) +
        Math.floor(index / 2) * -rect.width,
      {
        duration: ANIMATION_DURATION,
      }
    );
  };

  const animatedVertices = useDerivedValue(() => {
    return vertices.map((vertex, index) => {
      // let dx = 0;
      // if (index % 2 === 0) {
      //   dx = Math.floor(index / 2) * -rect.width;
      // } else {
      //   dx =
      //     rect.width * (Math.floor(numberOfStripes / 2) - 1) +
      //     Math.floor(index / 2) * -rect.width;
      // }

      return vec(
        vertex.x +
          //  dx,
          dx.value,
        vertex.y + dy.value
      );
    });
  }, [dx, dy]);
  console.log(vertices.length);

  return (
    <>
      <Vertices
        vertices={animatedVertices}
        textures={textures}
        indices={indices}
      />
      {/* <Skeleton vertices={vertices} indices={indices} /> */}
    </>
  );
};

const generateTrianglePointsAndIndices = (
  rct: SkRect,
  triangleNumberHeight: number
) => {
  const vertices: Vector[] = [];
  const textures: Vector[] = [];
  const indices: number[] = [];

  // Calculate the size of the triangles based on the given number
  const triangleWidth = rct.width;
  const triangleHeight = rct.height / triangleNumberHeight;

  // Generate the list of points
  for (let i = 0; i <= triangleNumberHeight; i++) {
    for (let j = 0; j <= 1; j++) {
      const point: Vector = vec(
        rct.x + j * triangleWidth,
        rct.y + i * triangleHeight
      );
      textures.push(point);
      vertices.push(point);
    }
  }

  // Generate the list of triangle indices
  for (let i = 0; i < triangleNumberHeight; i++) {
    const topLeftIndex = i * 2;
    const topRightIndex = topLeftIndex + 1;
    const bottomLeftIndex = topLeftIndex + 2;
    const bottomRightIndex = bottomLeftIndex + 1;

    // Create two triangles for each square and add their indices to the list
    indices.push(topLeftIndex, topRightIndex, bottomLeftIndex);
    indices.push(bottomLeftIndex, topRightIndex, bottomRightIndex);
  }

  return { vertices, indices, textures };
};
