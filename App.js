import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { Puzzle } from "./src/Puzzle";

export default function App() {
  return <Puzzle />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
