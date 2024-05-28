import type { Vector } from "@shopify/react-native-skia";
import { Skia, Path } from "@shopify/react-native-skia";
import React from "react";

interface SkeletonProps {
  vertices: Vector[];
  indices: number[];
}

export const Skeleton = ({ vertices, indices }: SkeletonProps) => {
  const path = indices.reduce((p, i, j) => {
    const vertex = vertices[i];
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
  path.close();
  return <Path path={path} style="stroke" strokeWidth={1} color="black" />;
};
