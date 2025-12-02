import React from "react";

interface ActionButtonProps {
  type: "edit" | "delete";
  onClick: () => void;
  className?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  type,
  onClick,
  className = "",
}) => {
  const getButtonContent = () => {
    switch (type) {
      case "edit":
        return "✏️";
      case "delete":
        return "🗑️";
      default:
        return "";
    }
  };

  const getButtonClass = () => {
    const baseClass = type === "edit" ? "edit-btn-small" : "delete-btn-small";
    return `${baseClass} ${className}`.trim();
  };

  return (
    <button className={getButtonClass()} onClick={onClick}>
      {getButtonContent()}
    </button>
  );
};
