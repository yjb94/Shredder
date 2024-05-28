import type {
  SkRect,
  SharedValueType,
  Vector,
} from "@shopify/react-native-skia";
import { Vertices, vec } from "@shopify/react-native-skia";
import { createNoise2D } from "simplex-noise";
import { Skeleton } from "./Skeleton";
import { useDerivedValue } from "react-native-reanimated";

const pad = 6;

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

interface StripeProps {
  rect: SkRect;
}

export const Stripe = ({ rect }: StripeProps) => {
  const { vertices, indices, textures } = generateTrianglePointsAndIndices(
    rect,
    20
  );
  const test = useDerivedValue(() => {});

  // const animatedVertices = useDerivedValue(() => {
  //   const noise = createNoise2D();
  //   return vertices.map((vertex, index) => {
  //     const A = 10;
  //     const fx = 100;
  //     const fy = 0.0005;
  //     const d = A * noise((fx * index) / vertices.length, fy * clock.value);
  //     return vec(vertex.x + d, vertex.y + d);
  //   });
  // }, [clock]);

  // const animatedVertices = useComputedValue(() => {
  //   const noise = createNoise2D();
  //   return vertices.map((vertex, index) => {
  //     const A = 10;
  //     const fx = 100;
  //     const fy = 0.0005;
  //     const d = A * noise((fx * index) / vertices.length, fy);
  //     return vec(vertex.x + d, vertex.y + d);
  //   });
  // }, []);

  return (
    <>
      <Vertices vertices={vertices} textures={textures} indices={indices} />
      <Skeleton vertices={vertices} indices={indices} />
    </>
  );
};
