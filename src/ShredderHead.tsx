import {
  Box,
  Circle,
  Group,
  rect,
  rrect,
  vec,
} from "@shopify/react-native-skia";
import React from "react";
import { SHREDDER_KNIFE_POSITION, shredderY, canvasWidth } from "./const";

const ShredderHead = () => {
  return (
    <Group>
      <Box
        box={rrect(
          rect(5, shredderY, canvasWidth - 10, SHREDDER_KNIFE_POSITION),
          12,
          12
        )}
        color="rgb(66,72,73)"
      />
      <Circle c={vec(33, shredderY + 25)} r={8} color="white" />
      <Circle c={vec(61, shredderY + 25)} r={8} color="rgb(248, 230, 167)" />
    </Group>
  );
};

export default ShredderHead;
