import {
  Canvas,
  Group,
  ImageShader,
  SkRect,
  Vector,
  Vertices,
  rect,
  useImage,
  useTouchHandler,
  vec,
} from "@shopify/react-native-skia";
import React from "react";
import {
  SharedValue,
  runOnJS,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import ShredderBack from "./ShredderBack";
import ShredderHead from "./ShredderHead";
import {
  NUMBER_OF_STRIPES,
  photo,
  pictureRect,
  shredderY,
  stripes,
  windowHeight,
  canvasWidth,
} from "./const";
import { generateTrianglePointsAndIndices } from "./utils";
import { createNoise2D } from "./simplex-noise/simplex-noise";
import { Skeleton } from "./Skeleton";

const verticalStripes: SkRect[] = [];
for (let i = 0; i < NUMBER_OF_STRIPES; i++) {
  verticalStripes.push(
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
shuffle1();

export type ShredPiecesProps = {
  onEnd?: () => void;
};

export const ShredPieces: React.FC<ShredPiecesProps> = ({ onEnd }) => {
  const picture = useImage(photo);

  const y = useSharedValue(0);
  const offset = useSharedValue(0);
  const isTouched = useSharedValue(false);

  const onTouch = useTouchHandler({
    onStart: (event) => {
      isTouched.value = true;
      offset.value = y.value - event.y;
    },
    onActive: (event) => {
      if (isTouched.value === false) {
        return;
      }
      const newY = offset.value + event.y;
      if (newY > y.value && newY < windowHeight - pictureRect.height) {
        y.value = newY;
      }
    },
    onEnd: () => {
      isTouched.value = false;
      y.value = withTiming(
        windowHeight + 200,
        {
          duration: 2000,
        },
        () => {
          runOnJS(onEnd)();
        }
      );
    },
  });

  const transform = useDerivedValue(() => {
    return [
      {
        translateX: canvasWidth / 2 - pictureRect.width / 2,
      },
      {
        translateY: 100,
      },
      {
        rotateZ: Math.PI / 2,
      },
      { translateX: y.value },
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

        <Group clip={rect(0, shredderY, canvasWidth, windowHeight)}>
          <Group
            transform={transform}
            origin={vec(pictureRect.width / 2, pictureRect.height / 2)}
          >
            <ImageShader image={picture} rect={pictureRect} fit="fill" />
            {verticalStripes.map((stripe, stripeIndex) => {
              return (
                <Stripe
                  key={stripeIndex}
                  stripe={stripe}
                  i={stripeIndex}
                  y={y}
                />
              );
            })}
          </Group>
        </Group>

        <ShredderHead />

        <Group clip={rect(0, 0, canvasWidth, shredderY)}>
          <Group
            transform={transform}
            origin={vec(pictureRect.width / 2, pictureRect.height / 2)}
          >
            <ImageShader image={picture} rect={pictureRect} fit="fill" />
            {stripes.map((stripe, stripeIndex) => {
              const { textures, indices } = generateTrianglePointsAndIndices(
                stripe,
                1
              );

              const dx =
                stripeIndex % 2 === 0
                  ? Math.floor(stripeIndex / 2) * -stripe.width
                  : stripe.width * (Math.floor(NUMBER_OF_STRIPES / 2) - 1) +
                    Math.floor(stripeIndex / 2) * -stripe.width;
              const newVertex = [
                vec(stripe.x + dx, stripe.y),
                vec(stripe.x + dx + stripe.width, stripe.y),
                vec(stripe.x + dx, stripe.y + stripe.height),
                vec(stripe.x + dx + stripe.width, stripe.y + stripe.height),
              ];

              return (
                <Vertices
                  key={stripeIndex}
                  vertices={newVertex}
                  textures={textures}
                  indices={indices}
                />
              );
            })}
          </Group>
        </Group>
      </Canvas>
    </>
  );
};

type StripeProps = {
  stripe: SkRect;
  i: number;
  y: SharedValue<number>;
};

const Stripe: React.FC<StripeProps> = ({ stripe, i: stripeIndex, y }) => {
  const noise = createNoise2D();

  const { vertices, indices, pieceTexture } = (() => {
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
          vec(pieceTextureRect.x, pieceTextureRect.y + pieceTextureRect.height)
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
  })();

  const animatedVertices = useDerivedValue(() => {
    return vertices.map((vertex, vertexIndex) => {
      const amplitude = 3;
      const frequencyX = 0.01;
      const frequencyY = 0.01;
      const delta =
        amplitude *
        noise(frequencyX * vertex.x, frequencyY * (vertex.y + y.value));

      return vec(vertex.x + delta, vertex.y + delta);
    });
  }, [vertices, y]);

  return (
    <>
      <Vertices
        vertices={animatedVertices}
        textures={pieceTexture}
        indices={indices}
      />
      {/* <Skeleton
        vertices={animatedVertices}
        indices={indices}
        color={pallete[stripeIndex]}
      /> */}
    </>
  );
};

const pallete = [
  "#69D2E7",
  "#A7DBD8",
  "#E0E4CC",
  "#F38630",
  "#FA6900",
  "#FE4365",
  "#FC9D9A",
  "#F9CDAD",
  "#C8C8A9",
  "#83AF9B",
  "#ECD078",
  "#D95B43",
  "#C02942",
  "#542437",
  "#53777A",
  "#556270",
  "#4ECDC4",
  "#C7F464",
  "#FF6B6B",
  "#C44D58",
];
