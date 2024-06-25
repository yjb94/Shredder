import {
  Canvas,
  Group,
  Image,
  ImageShader,
  Rect,
  SkPoint,
  SkRect,
  Vector,
  Vertices,
  interpolate,
  rect,
  useImage,
  useTouchHandler,
  vec,
} from "@shopify/react-native-skia";
import React, {
  createRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Dimensions, SafeAreaView } from "react-native";
import {
  SharedValue,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  generateTrianglePointsAndIndices,
  generateTrianglePointsAndIndicesVertical,
} from "./utils";
import { Skeleton } from "./Skeleton";
import { NUMBER_OF_STRIPES } from "./const";

// const ANIMATION_DURATION = 1500;
// const ANIMATION_DELAY = 500;
const ANIMATION_DURATION = 100;
const ANIMATION_DELAY = 100;

const STRIPE_Y_INTERVAL = 5;

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
      0,
      (i * pictureRect.height) / NUMBER_OF_STRIPES,
      pictureRect.width,
      pictureRect.height / NUMBER_OF_STRIPES
    )
  );
}

let textures: SkRect[][] = [];
for (let i = 0; i < NUMBER_OF_STRIPES; i++) {
  const stripe: SkRect[] = [];
  for (let j = 0; j < NUMBER_OF_STRIPES; j++) {
    const piece = rect(
      j * (pictureRect.width / NUMBER_OF_STRIPES),
      i * (pictureRect.height / NUMBER_OF_STRIPES),
      pictureRect.width / NUMBER_OF_STRIPES,
      pictureRect.height / NUMBER_OF_STRIPES
    );
    stripe.push(piece);
  }
  textures.push(stripe);
}
function shuffle1() {
  for (var i = 0; i < NUMBER_OF_STRIPES; i++) {
    var splitPart1 = [];
    for (var j = 0; j < NUMBER_OF_STRIPES; j += 2) {
      splitPart1.push(textures[i][j]);
    }
    var splitPart2 = [];
    for (var j = 1; j < NUMBER_OF_STRIPES; j += 2) {
      splitPart2.push(textures[i][j]);
    }
    textures[i] = splitPart1.concat(splitPart2);
  }
}
// function shuffle2() {
//   for (var i = 0; i < NUMBER_OF_STRIPES; i++) {
//     var splitPart1 = [];
//     for (var j = 0; j < NUMBER_OF_STRIPES; j += 2) {
//       splitPart1.push(pieces[i][j]);
//     }
//     var splitPart2 = [];
//     for (var j = 1; j < NUMBER_OF_STRIPES; j += 2) {
//       splitPart2.push(pieces[i][j]);
//     }
//     pieces[i] = splitPart1.concat(splitPart2);
//   }
// }
shuffle1();
// shuffle2();

export const ShredPieces = () => {
  // const picture = useImage(require("./assets/grid.png"));
  const picture = useImage(require("./assets/art2.jpg"));
  const pastaMachine1 = useImage(require("./assets/pm1.png"));
  const pastaMachine2 = useImage(require("./assets/pm2.png"));

  const y = useSharedValue(0);
  const offset = useSharedValue(0);

  const [isStripeCropped, setIsStripeCropped] = useState(false);
  const stripesRef = useRef(stripes.map(() => createRef<Stripe>()));

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
      y.value = withTiming(windowHeight - pictureRect.height, {
        duration: 1500,
      });
    },
  });

  const transform = useDerivedValue(() => {
    return [
      {
        translateX: windowWidth / 2 - pictureRect.width / 2,
      },
      {
        rotateZ: Math.PI / 2,
      },
      { translateX: y.value },
    ];
  }, [y]);

  const pastaMachineTransform = [{ translateY: pastaMachineY }];

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
        <Image
          transform={pastaMachineTransform}
          image={pastaMachine2}
          rect={pastaMachineRect}
        />
        <Group
          transform={transform}
          origin={vec(pictureRect.width / 2, pictureRect.height / 2)}
        >
          <ImageShader image={picture} rect={pictureRect} fit="fill" />
          {stripes.map((stripe, stripeIndex) => {
            // if (stripeIndex === 4)
            return (
              <Stripe key={stripeIndex} stripe={stripe} i={stripeIndex} y={y} />
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

type Stripe = {
  animate: () => void;
};

type StripeProps = {
  stripe: SkRect;
  i: number;
  y: SharedValue<number>;
};

const Stripe: React.FC<StripeProps> = React.forwardRef<Stripe, StripeProps>(
  ({ stripe, i: stripeIndex, y }, ref) => {
    const dx = useSharedValue(0);
    const dy = useSharedValue(0);

    const { vertices, indices, pieceTexture } = useMemo(() => {
      const animatedStripe = rect(
        stripe.x,
        stripe.y,
        stripe.width,
        stripe.height
      );
      const vertices: Vector[] = [];
      const pieceTexture: Vector[] = [];
      let indices: number[] = [];
      for (let pieceIndex = 0; pieceIndex <= NUMBER_OF_STRIPES; pieceIndex++) {
        const pieceWidth = stripe.width / NUMBER_OF_STRIPES;
        const piece = rect(
          animatedStripe.x + pieceWidth * pieceIndex,
          animatedStripe.y,
          pieceWidth,
          animatedStripe.height
        );
        //top left
        vertices.push(vec(piece.x, piece.y));
        //bottom left
        vertices.push(vec(piece.x, piece.y + piece.height));
        //top right
        vertices.push(vec(piece.x + piece.width, piece.y));
        //bottom right
        vertices.push(vec(piece.x + piece.width, piece.y + piece.height));

        const pieceTextureRect = textures[stripeIndex][pieceIndex];
        if (pieceTextureRect) {
          pieceTexture.push(vec(pieceTextureRect.x, pieceTextureRect.y));
          pieceTexture.push(
            vec(
              pieceTextureRect.x,
              pieceTextureRect.y + pieceTextureRect.height
            )
          );
          pieceTexture.push(
            vec(pieceTextureRect.x + pieceTextureRect.width, pieceTextureRect.y)
          );
          pieceTexture.push(
            vec(
              pieceTextureRect.x + pieceTextureRect.width,
              pieceTextureRect.y + pieceTextureRect.height
            )
          );
        }
      }

      for (let pieceIndex = 0; pieceIndex < NUMBER_OF_STRIPES; pieceIndex++) {
        const leftTopIndex = pieceIndex * 4;
        const leftBottomIndex = leftTopIndex + 1;
        const rightTopIndex = leftTopIndex + 2;
        const rightBottomIndex = rightTopIndex + 1;
        indices.push(leftTopIndex, rightTopIndex, rightBottomIndex);
        indices.push(leftTopIndex, leftBottomIndex, rightBottomIndex);
      }

      return {
        vertices,
        indices,
        pieceTexture,
      };
    }, [stripe]);

    const animatedVertices = useDerivedValue(() => {
      return vertices.map((vertex, vertexIndex) => {
        const dy = interpolate(
          y.value,
          [0, windowHeight],
          [
            0,
            (stripeIndex % 2 === 0 ? -1 : 1) *
              vertexIndex *
              vertexIndex *
              0.008,
          ]
        );

        return vec(vertex.x, vertex.y + dy);
      });
    }, [vertices, y]);

    return (
      <>
        <Vertices
          vertices={animatedVertices}
          textures={pieceTexture}
          indices={indices}
        />
        {/* <Skeleton vertices={animatedVertices} indices={indices} /> */}
      </>
    );
  }
);
