import React from "react";

interface ActionButtonProps {
  type: "edit" | "delete" | "info";
  onClick: () => void;
  className?: string;
  title?: string;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  type,
  onClick,
  className = "",
  title,
}) => {
  const getButtonContent = () => {
    switch (type) {
      case "edit":
        return "✏️";
      case "delete":
        return "🗑️";
      case "info":
        return "📝";
      default:
        return "";
    }
  };

  const getButtonClass = () => {
    let baseClass;
    switch (type) {
      case "edit":
        baseClass = "edit-btn-small";
        break;
      case "delete":
        baseClass = "delete-btn-small";
        break;
      case "info":
        baseClass = "info-btn-small";
        break;
      default:
        baseClass = "";
    }
    return `${baseClass} ${className}`.trim();
  };

  return (
    <button className={getButtonClass()} onClick={onClick} title={title}>
      {getButtonContent()}
    </button>
  );
};
