import {
  Canvas,
  Group,
  ImageShader,
  SkRect,
  Vector,
  Vertices,
  rect,
  useImage,
  vec,
} from "@shopify/react-native-skia";
import React, {
  createRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import {
  SharedValue,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  NUMBER_OF_STRIPES,
  photo,
  pictureRect,
  windowHeight,
  windowWidth,
} from "./const";

const ANIMATION_DURATION = 1500;
const ANIMATION_DELAY = 500;

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

export type MovePiecesProps = {
  onEnd?: () => void;
};
export const MovePieces: React.FC<MovePiecesProps> = ({ onEnd }) => {
  const picture = useImage(photo);

  const y = useSharedValue(0);

  const stripesRef = useRef(verticalStripes.map(() => createRef<Stripe>()));
  const interval = useRef<NodeJS.Timeout>(null);
  const lastAnimationTimeout = useRef<NodeJS.Timeout>(null);
  var animationIndexRef = useRef(0);

  useEffect(() => {
    setTimeout(() => {
      if (stripesRef.current) {
        if (
          stripesRef.current.map((ref) => ref.current).filter((ref) => ref)
            .length === NUMBER_OF_STRIPES
        ) {
          interval.current = setInterval(animate, ANIMATION_DELAY);
        }
      }
    }, 1000);
  });

  const animate = () => {
    if (lastAnimationTimeout.current) {
      return;
    }

    if (animationIndexRef.current >= stripesRef.current.length) {
      clearInterval(interval.current);
      interval.current = null;

      lastAnimationTimeout.current = setTimeout(() => {
        stripesRef.current.forEach((ref) => ref.current?.moveStripes2());

        setTimeout(() => {
          onEnd();
        }, ANIMATION_DELAY + ANIMATION_DURATION + 1000);
      }, ANIMATION_DELAY + ANIMATION_DURATION);

      return;
    }
    stripesRef.current[animationIndexRef.current].current?.moveStripes();
    animationIndexRef.current += 1;
  };

  const transform = useDerivedValue(() => {
    return [
      {
        translateX: windowWidth / 2 - pictureRect.width / 2,
      },
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
      >
        <Group
          transform={transform}
          origin={vec(pictureRect.width / 2, pictureRect.height / 2)}
        >
          <ImageShader image={picture} rect={pictureRect} fit="fill" />
          {verticalStripes.map((stripe, stripeIndex) => {
            return (
              <Stripe
                key={stripeIndex}
                ref={stripesRef.current[stripeIndex]}
                stripe={stripe}
                i={stripeIndex}
                y={y}
              />
            );
          })}
        </Group>
      </Canvas>
    </>
  );
};

type Stripe = {
  moveStripes: () => void;
  moveStripes2: () => void;
};

type StripeProps = {
  stripe: SkRect;
  i: number;
  y: SharedValue<number>;
};

const Stripe: React.FC<StripeProps> = React.forwardRef<Stripe, StripeProps>(
  ({ stripe, i: stripeIndex, y }, ref) => {
    const dx = useSharedValue(0);
    const dy = useSharedValue(windowHeight / 4);

    const random = Math.random() * 4;
    const interval = (stripeIndex - NUMBER_OF_STRIPES / 2) * 2;
    const dx2 = useSharedValue(random);
    const dy2 = useSharedValue(random + interval);

    useImperativeHandle(
      ref,
      () => ({
        moveStripes,
        moveStripes2,
      }),
      []
    );
    const moveStripes = () => {
      if (stripeIndex % 2 === 0) {
        dx.value = withTiming(-stripe.width / 2, {
          duration: ANIMATION_DURATION,
        });
        dy.value = withTiming(
          windowHeight / 4 + Math.floor(stripeIndex / 2) * -stripe.height,
          {
            duration: ANIMATION_DURATION,
          }
        );
      } else {
        dx.value = withTiming(stripe.width / 2, {
          duration: ANIMATION_DURATION,
        });
        dy.value = withTiming(
          windowHeight / 4 + Math.floor(stripeIndex / 2 + 1) * -stripe.height,
          {
            duration: ANIMATION_DURATION,
          }
        );
      }
      dx2.value = withTiming(0, { duration: ANIMATION_DURATION });
      dy2.value = withTiming(0, { duration: ANIMATION_DURATION });
    };

    const moveStripes2 = () => {
      const base =
        windowHeight / 2 - (stripe.height * NUMBER_OF_STRIPES) / 2 / 2;

      if (stripeIndex % 2 === 0) {
        dy.value = withTiming(
          base + Math.floor(stripeIndex / 2) * -stripe.height,
          {
            duration: ANIMATION_DURATION,
          }
        );
      } else {
        dy.value = withTiming(
          base + Math.floor(stripeIndex / 2 + 1) * -stripe.height,
          {
            duration: ANIMATION_DURATION,
          }
        );
      }
    };

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
        return vec(
          vertex.x + dx.value + dx2.value,
          vertex.y + dy.value + dy2.value
        );
      });
    }, [vertices, y, dx, dy]);

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
