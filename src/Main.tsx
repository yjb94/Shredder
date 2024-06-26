import { useState } from "react";
import { ShredStripes } from "./ShredStripes";
import { MoveStripes } from "./MoveStripes";
import { ShredPieces } from "./ShredPieces";
import { MovePieces } from "./MovePieces";

const Main = () => {
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
};

export { Main };
