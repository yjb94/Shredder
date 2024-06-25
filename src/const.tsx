import { SkRect, rect } from "@shopify/react-native-skia";
import { Dimensions } from "react-native";

export const NUMBER_OF_STRIPES = 20;

export const pictureRatio = 1792 / 2304;
export const { width: windowWidth, height: windowHeight } =
  Dimensions.get("window");

export const photo = require("./assets/skyscraper.jpg");

export const pictureRect = rect(
  0,
  0,
  windowWidth / 2,
  windowWidth / 2 / pictureRatio
);

export const STRIPE_INTERVAL = 0;

export const stripes: SkRect[] = [];
for (let i = 0; i < NUMBER_OF_STRIPES; i++) {
  stripes.push(
    rect(
      i * (pictureRect.width / NUMBER_OF_STRIPES),
      0,
      pictureRect.width / NUMBER_OF_STRIPES - STRIPE_INTERVAL,
      pictureRect.height
    )
  );
}
