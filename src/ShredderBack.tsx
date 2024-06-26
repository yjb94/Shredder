import { View, Text } from "react-native";
import React from "react";
import { Box, Group, Rect, rect, rrect } from "@shopify/react-native-skia";
import {
  SHREDDER_HEIGHT,
  SHREDDER_KNIFE_POSITION,
  shredderY,
  canvasWidth,
} from "./const";

const ShredderBack = () => {
  return (
    <Group>
      <Box
        box={rrect(
          rect(5, shredderY, canvasWidth - 10, SHREDDER_HEIGHT),
          12,
          12
        )}
        color="rgb(66,72,73)"
      />
      <Rect
        rect={rect(
          25,
          shredderY + SHREDDER_KNIFE_POSITION,
          canvasWidth - 50,
          5
        )}
        color="rgb(47,52,59)"
      />
    </Group>
  );
};

export default ShredderBack;
