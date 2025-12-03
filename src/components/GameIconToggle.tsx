import React from "react";
import { GameMarkerSettings } from "../types";

interface GameIconToggleProps {
  availableTypes: string[];
  gameMarkerSettings: GameMarkerSettings;
  onToggleMarkerType: (type: string) => void;
}

export const GameIconToggle: React.FC<GameIconToggleProps> = ({
  availableTypes,
  gameMarkerSettings,
  onToggleMarkerType,
}) => {
  return (
    <div className="game-icon-toggle-panel">
      {availableTypes.map((type) => {
        const config = gameMarkerSettings[type];
        if (!config) return null;

        return (
          <button
            key={type}
            className={`game-icon-toggle ${
              config.visible ? "active" : "inactive"
            }`}
            onClick={() => onToggleMarkerType(type)}
            title={`${config.displayName} ${
              config.visible ? "숨기기" : "표시"
            }`}
          >
            <span
              className="game-icon-emoji"
              style={{
                color: config.visible ? config.color : "#999",
                opacity: config.visible ? 1 : 0.5,
              }}
            >
              {config.icon}
            </span>
          </button>
        );
      })}
    </div>
  );
};
