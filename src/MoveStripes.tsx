import {
  Canvas,
  Group,
  ImageShader,
  SkRect,
  Vertices,
  useImage,
  vec,
} from "@shopify/react-native-skia";
import React, {
  createRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import { SafeAreaView } from "react-native";
import {
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import {
  NUMBER_OF_STRIPES,
  photo,
  pictureRect,
  stripes,
  windowHeight,
  windowWidth,
} from "./const";
import { generateTrianglePointsAndIndices } from "./utils";

const ANIMATION_DURATION = 1500;
const ANIMATION_DELAY = 500;

const STRIPE_Y_INTERVAL = 5;

export type MoveStripesProps = {
  onEnd?: () => void;
};
export const MoveStripes: React.FC<MoveStripesProps> = ({ onEnd }) => {
  const picture = useImage(photo);

  const stripesRef = useRef(stripes.map(() => createRef<Stripe>()));
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

  if (!picture) {
    return null;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Canvas style={{ flex: 1 }}>
        <Group
          transform={[
            {
              translateX: windowWidth / 4,
            },
          ]}
        >
          <ImageShader image={picture} rect={pictureRect} fit="fill" />
          {stripes.map((stripe, i) => {
            return (
              <Stripe
                key={i}
                ref={stripesRef.current[i]}
                stripe={stripe}
                i={i}
              />
            );
          })}
        </Group>
      </Canvas>
      {/* <Button title="Add Step" onPress={addStep} /> */}
    </SafeAreaView>
  );
};

type Stripe = {
  moveStripes: () => void;
  moveStripes2: () => void;
};

type StripeProps = {
  stripe: SkRect;
  i: number;
};

const Stripe: React.FC<StripeProps> = React.forwardRef<Stripe, StripeProps>(
  ({ stripe, i: stripeIndex }, ref) => {
    const dx = useSharedValue(0);
    const dy = useSharedValue(windowHeight / 4);

    const random = Math.random() * 4;
    const interval = (stripeIndex - NUMBER_OF_STRIPES / 2) * 2;
    const dx2 = useSharedValue(random + interval);
    const dy2 = useSharedValue(random);

    const { vertices, textures, indices } = generateTrianglePointsAndIndices(
      stripe,
      1
    );

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
        dx.value = withTiming(Math.floor(stripeIndex / 2) * -stripe.width, {
          duration: ANIMATION_DURATION,
        });
        dy.value = withTiming(
          windowHeight / 4 - stripe.height / 2 - STRIPE_Y_INTERVAL,
          {
            duration: ANIMATION_DURATION,
          }
        );
      } else {
        dx.value = withTiming(Math.floor(stripeIndex / 2 + 1) * -stripe.width, {
          duration: ANIMATION_DURATION,
        });
        dy.value = withTiming(
          windowHeight / 4 + stripe.height / 2 + STRIPE_Y_INTERVAL,
          {
            duration: ANIMATION_DURATION,
          }
        );
      }
      dx2.value = withTiming(0, { duration: ANIMATION_DURATION });
      dy2.value = withTiming(0, { duration: ANIMATION_DURATION });
    };

    const moveStripes2 = () => {
      if (stripeIndex % 2 === 0) {
        dx.value = withTiming(Math.floor(stripeIndex / 2) * -stripe.width, {
          duration: ANIMATION_DURATION,
        });
        dy.value = withTiming(windowHeight / 4, {
          duration: ANIMATION_DURATION,
        });
      } else {
        dx.value = withTiming(
          stripe.width * (Math.floor(NUMBER_OF_STRIPES / 2) - 1) +
            Math.floor(stripeIndex / 2) * -stripe.width,
          {
            duration: ANIMATION_DURATION,
          }
        );
        dy.value = withTiming(windowHeight / 4, {
          duration: ANIMATION_DURATION,
        });
      }
    };

    const animatedVertices = useDerivedValue(() => {
      return vertices.map((vertex, vertexIndex) => {
        // const amplitude = 10;
        // const frequency = 1;
        // const random = amplitude * noise(frequency * vertexIndex, frequency);
        return vec(
          vertex.x + dx.value + dx2.value,
          vertex.y + dy.value + dy2.value
        );
      });
    }, [stripeIndex, dx, dy, moveStripes]);

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
  }
);
