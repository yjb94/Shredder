import { LoadSkiaWeb } from "@shopify/react-native-skia/lib/module/web";
import { useEffect, useState } from "react";
import { Platform, Text } from "react-native";
import { Main } from "./src/Main";

export default function App() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") {
      LoadSkiaWeb({ locateFile: () => "/canvaskit.wasm" })
        .then(() => {
          setLoaded(true);
        })
        .catch((err) => console.error(err));
    } else {
      setLoaded(true);
    }
  }, []);

  if (!loaded) {
    return <Text>Loading Skia...</Text>;
  }

  return <Main />;
}
