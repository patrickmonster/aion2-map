import React from "react";
import "../components/MaterialCalculator/index.css";

interface FloatingCalculatorButtonProps {
  onClick: () => void;
}

const FloatingCalculatorButton: React.FC<FloatingCalculatorButtonProps> = ({
  onClick,
}) => {
  return (
    <button
      className="floating-calculator-button"
      onClick={onClick}
      title="재료 계산기"
    >
      📊
    </button>
  );
};

export default FloatingCalculatorButton;
