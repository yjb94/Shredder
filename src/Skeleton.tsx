import type { AnimatedProp, Color, Vector } from "@shopify/react-native-skia";
import { Skia, Path } from "@shopify/react-native-skia";
import React from "react";
import { SharedValue, useDerivedValue } from "react-native-reanimated";

interface SkeletonProps {
  vertices: SharedValue<Vector[]>;
  indices: number[];
  color?: AnimatedProp<Color>;
}

export const Skeleton = ({ vertices, indices, color }: SkeletonProps) => {
  const path = useDerivedValue(() => {
    return indices.reduce((p, i, j) => {
      const vertex = vertices.value ? vertices.value[i] : vertices[i];
      if (j % 3 === 0) {
        if (j > 0) {
          p.close();
        }
        p.moveTo(vertex.x, vertex.y);
      } else {
        p.lineTo(vertex.x, vertex.y);
      }
      return p;
    }, Skia.Path.Make());
  }, []);
  return (
    <Path path={path} style="stroke" strokeWidth={1} color={color || "black"} />
  );
};
