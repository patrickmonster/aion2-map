import React from "react";
import { GameMarkerSettings } from "../types";

interface GameMarkerSettingsProps {
  availableTypes: string[];
  gameMarkerSettings: GameMarkerSettings;
  onToggleMarkerType: (type: string) => void;
}

export const GameMarkerSettingsPanel: React.FC<GameMarkerSettingsProps> = ({
  availableTypes,
  gameMarkerSettings,
  onToggleMarkerType,
}) => {
  return (
    <div className="game-marker-settings">
      <h4>게임 마커 설정</h4>
      <p className="settings-description">
        게임 마커는 읽기 전용이며, 표시/숨김만 변경할 수 있습니다.
      </p>
      <div className="game-marker-types">
        {availableTypes.map((type) => {
          const config = gameMarkerSettings[type];
          if (!config) return null;

          return (
            <div
              key={type}
              className={`game-marker-type-item ${
                config.readonly ? "readonly" : ""
              }`}
            >
              <div className="marker-type-header">
                <label className="marker-toggle">
                  <input
                    type="checkbox"
                    checked={config.visible || false}
                    onChange={() => onToggleMarkerType(type)}
                  />
                  <span
                    className="marker-type-icon"
                    style={{ color: config.color }}
                  >
                    {config.icon}
                  </span>
                  <span className="marker-type-name">{config.displayName}</span>
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
