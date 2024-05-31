import type { Vector } from "@shopify/react-native-skia";
import { Skia, Path } from "@shopify/react-native-skia";
import React from "react";
import { SharedValue, useDerivedValue } from "react-native-reanimated";

interface SkeletonProps {
  vertices: SharedValue<Vector[]>;
  indices: number[];
}

export const Skeleton = ({ vertices, indices }: SkeletonProps) => {
  const path = useDerivedValue(() => {
    return indices.reduce((p, i, j) => {
      const vertex = vertices.value[i];
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
  return <Path path={path} style="stroke" strokeWidth={1} color="black" />;
};
