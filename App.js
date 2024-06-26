import { useState } from "react";
import { MovePieces } from "./src/MovePieces";
import { MoveStripes } from "./src/MoveStripes";
import { ShredPieces } from "./src/ShredPieces";
import { ShredStripes } from "./src/ShredStripes";

export default function App() {
  const [step, setStep] = useState(0);

  const toNextStep = () => {
    if (step === 3) {
      setStep(0);
      return;
    }
    setStep((prev) => prev + 1);
  };

  if (step === 0) {
    return <ShredStripes onEnd={toNextStep} />;
  }
  if (step === 1) {
    return <MoveStripes onEnd={toNextStep} />;
  }
  if (step === 2) {
    return <ShredPieces onEnd={toNextStep} />;
  }
  if (step === 3) {
    return <MovePieces onEnd={toNextStep} />;
  }
}
