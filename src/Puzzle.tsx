import {
  Canvas,
  Group,
  ImageShader,
  SkRect,
  Vertices,
  rect,
  useImage,
  useTouchHandler,
  vec,
} from "@shopify/react-native-skia";
import React, { useEffect, useRef, useState } from "react";
import { Button, SafeAreaView, useWindowDimensions } from "react-native";
import {
  SharedValue,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const NUMBER_OF_STRIPES = 16;

const ANIMATION_DURATION = 1500;
const ANIMATION_DELAY = 500;

export const Puzzle = () => {
  const picture = useImage(require("./assets/art2.jpg"));
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [step, setStep] = useState(0);

  const y = useSharedValue(0);
  const offset = useSharedValue(0);

  const addStep = () => {
    setStep((prev) => prev + 1);
  };
  const minusStep = () => {
    setStep((prev) => prev - 1);
  };
  const resetStep = () => {
    setStep(0);
  };

  const onTouch = useTouchHandler({
    onStart: (event) => {
      offset.value = y.value - event.y;
    },
    onActive: (event) => {
      const newY = offset.value + event.y;
      if (newY > y.value) {
        y.value = newY;
      }
    },
  });

  const transform = useDerivedValue(() => {
    return [{ translateY: y.value }];
  }, [y]);

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

  // const rects: SkRect[][] = [];
  // for (let i = 0; i < NUMBER_OF_STRIPES; i++) {
  //   const stripe: SkRect[] = [];
  //   for (let j = 0; j < NUMBER_OF_STRIPES; j++) {
  //     stripe.push(
  //       rect(
  //         (i * pictureRect.width) / NUMBER_OF_STRIPES,
  //         (j * pictureRect.height) / NUMBER_OF_STRIPES,
  //         pictureRect.width / NUMBER_OF_STRIPES,
  //         pictureRect.height / NUMBER_OF_STRIPES
  //       )
  //     );
  //   }
  //   rects.push(stripe);
  // }
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

  return (
    <>
      <Canvas
        style={{
          flex: 1,
          // backgroundColor: "grey",
        }}
        onTouch={onTouch}
      >
        <Group transform={transform}>
          <Group
            transform={[
              {
                translateX: windowWidth / 4,
              },
            ]}
          >
            <ImageShader image={picture} rect={pictureRect} fit="fill" />
            {stripes.map((stripe, i) => {
              return <Stripe key={i} stripe={stripe} i={i} step={step} />;
            })}
          </Group>
        </Group>
      </Canvas>
      <Button title="Add Step" onPress={addStep} />
    </>
  );
};

type StripeProps = {
  stripe: SkRect;
  i: number;
  step: number;
};

const Stripe: React.FC<StripeProps> = ({ stripe, i, step }) => {
  const pieces = useDerivedValue(() => {
    const pieceWidth = stripe.width;
    const pieceHeight = stripe.height / NUMBER_OF_STRIPES;
    const pieces: SkRect[] = [];
    for (let j = 0; j < NUMBER_OF_STRIPES; j++) {
      pieces.push(
        rect(stripe.x, stripe.y + j * pieceHeight, pieceWidth, pieceHeight)
      );
    }
    return pieces;
  }, [stripe]);

  return pieces.value.map((piece, j) => {
    return <Piece key={j} piece={piece} i={i} j={j} step={step} />;
  });
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

  let dx = useSharedValue(0);
  let dy = useSharedValue(0);

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
      {/* <Skeleton vertices={vertices} indices={indices} /> */}
    </>
  );
};
