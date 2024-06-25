import {
  Canvas,
  Group,
  Image,
  ImageShader,
  SkRect,
  Vertices,
  interpolate,
  rect,
  useImage,
  useTouchHandler,
  vec,
} from "@shopify/react-native-skia";
import React, { useEffect, useRef, useState } from "react";
import { Button, Dimensions, useWindowDimensions } from "react-native";
import {
  SharedValue,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Skeleton } from "./Skeleton";
import { generateTrianglePointsAndIndices } from "./utils";
import { NUMBER_OF_STRIPES } from "./const";

const ANIMATION_DURATION = 1500;
const ANIMATION_DELAY = 500;

const pictureRatio = 564 / 1030;
const pastaMachineRatio = 1596 / 1435;
const { width: windowWidth, height: windowHeight } = Dimensions.get("window");

const pictureRect = rect(0, 0, windowWidth / 2, windowWidth / 2 / pictureRatio);

const pastaMachineRect = rect(
  0,
  0,
  windowWidth,
  windowWidth / pastaMachineRatio
);

const pastaMachineY = 400;

const stripes: SkRect[] = [];
for (let i = 0; i < NUMBER_OF_STRIPES; i++) {
  stripes.push(
    rect(
      i * (pictureRect.width / NUMBER_OF_STRIPES),
      0,
      pictureRect.width / NUMBER_OF_STRIPES,
      pictureRect.height
    )
  );
}

export const ShredStripes = () => {
  const pastaMachine1 = useImage(require("./assets/pm1.png"));
  const pastaMachine2 = useImage(require("./assets/pm2.png"));
  const picture = useImage(require("./assets/art2.jpg"));

  const y = useSharedValue(0);
  const offset = useSharedValue(0);

  const [isStripeCropped, setIsStripeCropped] = useState(false);

  const onTouch = useTouchHandler({
    onStart: (event) => {
      offset.value = y.value - event.y;
    },
    onActive: (event) => {
      const newY = offset.value + event.y;
      console.log(windowHeight - pictureRect.height);
      if (newY > y.value && newY < windowHeight - pictureRect.height) {
        y.value = newY;
      }
    },
    onEnd: () => {
      setIsStripeCropped(true);
      y.value = withTiming(windowHeight - pictureRect.height, {
        duration: 1500,
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

  if (!picture || !pastaMachine1 || !pastaMachine2) {
    return null;
  }

  const pastaMachineTransform = [{ translateY: pastaMachineY }];

  const steps = () => {
    // shred the picture
    // move the stripes(one by one)
    // bond the stripes
    // rotate the bonded stripes
    // shred the bonded stripes
    // move the pieces
    // bond the pieces
  };

  const animteToShreddedStripes = () => {};

  return (
    <>
      <Canvas
        style={{
          flex: 1,
        }}
        onTouch={onTouch}
      >
        <Image
          transform={pastaMachineTransform}
          image={pastaMachine2}
          rect={pastaMachineRect}
        />
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
        <Group
          clip={rect(windowWidth / 4, 0, pictureRect.width, pastaMachineY + 50)}
        >
          <Group transform={transform}>
            <Image image={picture} rect={pictureRect} />
          </Group>
        </Group>
        <Image
          image={pastaMachine1}
          rect={pastaMachineRect}
          transform={pastaMachineTransform}
        />
      </Canvas>
      {/* <Button title="Add Step" onPress={addStep} /> */}
    </>
  );
};

type StripeProps = {
  stripe: SkRect;
  y: SharedValue<number>;
  i: number;
  isCroped: boolean;
};

const Stripe: React.FC<StripeProps> = ({
  stripe,
  y,
  i: stripeIndex,
  isCroped,
}) => {
  const { vertices, textures, indices } = generateTrianglePointsAndIndices(
    stripe,
    NUMBER_OF_STRIPES
  );

  const animatedVertices = useDerivedValue(() => {
    return vertices.map((vertex, vertexIndex) => {
      // if (!isCroped) {
      const dx = interpolate(
        y.value,
        [0, windowHeight],
        [0, (stripeIndex % 2 === 0 ? -1 : 1) * vertexIndex * vertexIndex * 0.03]
      );
      return vec(vertex.x + dx, vertex.y);
      // } else {
      //   let dx = 0;
      //   const shrinkY = 1;

      //   if (stripeIndex % 2 === 1) {
      //     dx = -1 * (stripeIndex - 10) + vertexIndex * vertexIndex * 0.02;
      //     //  -stripe.width * 0.5;
      //   } else {
      //     dx = -vertexIndex * vertexIndex * 0.02;
      //   }

      //   return vec(vertex.x + dx, vertex.y * shrinkY);
      // }
    });
  }, [y, stripeIndex, isCroped]);

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
  // const pieces = useDerivedValue(() => {
  //   const pieceWidth = stripe.width;
  //   const pieceHeight = stripe.height / NUMBER_OF_STRIPES;
  //   const pieces: SkRect[] = [];
  //   for (let j = 0; j < NUMBER_OF_STRIPES; j++) {
  //     pieces.push(
  //       rect(stripe.x, stripe.y + j * pieceHeight, pieceWidth, pieceHeight)
  //     );
  //   }
  //   return pieces;
  // }, [stripe]);

  // return pieces.value.map((piece, j) => {
  //   return <Piece key={j} piece={piece} i={i} j={j} step={step} />;
  // });
};

type PieceProps = {
  piece: SkRect;
  i: number;
  j: number;
  step: number;
};

const Piece: React.FC<PieceProps> = ({ piece, i, j, step }) => {
  const toDx = useRef(0);
  const toDy = useRef(0);

  const dx = useSharedValue(0);
  const dy = useSharedValue(0);

  const WINDOW_HEIGHT = useWindowDimensions().height;

  useEffect(() => {
    if (step === 0) {
      toDx.current = 0;
      toDy.current = 0;
      animate();
    } else if (step === 1) {
      if (i % 2 === 0) {
        setTimeout(() => {
          toDx.current = Math.floor(i / 2) * -piece.width;
          toDy.current = 0;
          animate();
        }, ANIMATION_DURATION + ANIMATION_DELAY);
      } else {
        toDy.current = WINDOW_HEIGHT / 4;
        animate();

        setTimeout(() => {
          toDx.current =
            piece.width * (Math.floor(NUMBER_OF_STRIPES / 2) - 1) +
            Math.floor(i / 2) * -piece.width;
          toDy.current = 0;
          animate();
        }, ANIMATION_DURATION + ANIMATION_DELAY);
      }
    } else if (step === 2) {
      const pictureWidth = piece.width * Math.floor(NUMBER_OF_STRIPES / 2);
      if (j % 2 === 0) {
        toDx.current += -pictureWidth;
        animate();
        setTimeout(() => {
          toDy.current += Math.floor(j / 2) * -piece.height;
          toDy.current +=
            (piece.height * Math.floor(NUMBER_OF_STRIPES / 2)) / 2;
          animate();
        }, ANIMATION_DURATION + ANIMATION_DELAY);
      } else {
        toDx.current += pictureWidth;
        animate();
        setTimeout(() => {
          toDy.current +=
            piece.height * (Math.floor(NUMBER_OF_STRIPES / 2) - 1) +
            Math.floor(j / 2) * -piece.height;
          toDy.current += -(
            (piece.height * Math.floor(NUMBER_OF_STRIPES / 2)) /
            2
          );
          animate();
        }, ANIMATION_DURATION + ANIMATION_DELAY);
      }
    }
  }, [step, toDx.current, toDy.current]);

  const animate = () => {
    dx.value = withTiming(toDx.current, { duration: ANIMATION_DURATION });
    dy.value = withTiming(toDy.current, { duration: ANIMATION_DURATION });
  };

  // if (step === 0) {
  //   toDx.current = 0;
  //   toDy.current = 0;
  // } else if (step === 1) {
  //   if (i % 2 === 0) {
  //     toDx.current = Math.floor(i / 2) * -piece.width;
  //     toDy.current = 0;
  //   } else {
  //     toDx.current =
  //       piece.width * (Math.floor(NUMBER_OF_STRIPES / 2) - 1) +
  //       Math.floor(i / 2) * -piece.width;
  //     toDy.current = 0;
  //   }
  // } else if (step === 2) {
  //   if (j % 2 === 0) {
  //     toDy.current = Math.floor(j / 2) * -piece.height;
  //     toDy.current += (piece.height * Math.floor(NUMBER_OF_STRIPES / 2)) / 2;

  //     toDx.current += piece.width * Math.floor(NUMBER_OF_STRIPES / 2);
  //   } else {
  //     toDy.current +=
  //       piece.height * (Math.floor(NUMBER_OF_STRIPES / 2) - 1) +
  //       Math.floor(j / 2) * -piece.height;
  //     toDy.current += -((piece.height * Math.floor(NUMBER_OF_STRIPES / 2)) / 2);

  //     toDx.current += -(piece.width * Math.floor(NUMBER_OF_STRIPES / 2));
  //   }
  // }

  const textures = [
    vec(piece.x, piece.y), // top-left
    vec(piece.x + piece.width, piece.y), // top-right
    vec(piece.x + piece.width, piece.y + piece.height), // bottom-right
    vec(piece.x, piece.y + piece.height), // bottom-left
  ];

  const vertices = useDerivedValue(() => {
    const newRect = rect(
      piece.x + dx.value,
      piece.y + dy.value,
      piece.width,
      piece.height
    );

    return [
      vec(newRect.x, newRect.y), // top-left
      vec(newRect.x + newRect.width, newRect.y), // top-right
      vec(newRect.x + newRect.width, newRect.y + newRect.height), // bottom-right
      vec(newRect.x, newRect.y + newRect.height), // bottom-left
    ];
  }, [dx, dy]);

  // const vertices = (() => {
  //   const newRect = rect(
  //     piece.x + toDx.current,
  //     piece.y + toDy.current,
  //     piece.width,
  //     piece.height
  //   );

  //   return [
  //     vec(newRect.x, newRect.y), // top-left
  //     vec(newRect.x + newRect.width, newRect.y), // top-right
  //     vec(newRect.x + newRect.width, newRect.y + newRect.height), // bottom-right
  //     vec(newRect.x, newRect.y + newRect.height), // bottom-left
  //   ];
  // })();

  const indices = [0, 1, 2, 0, 2, 3];

  return (
    <>
      <Vertices vertices={vertices} textures={textures} indices={indices} />
      <Skeleton vertices={vertices} indices={indices} />
    </>
  );
};
