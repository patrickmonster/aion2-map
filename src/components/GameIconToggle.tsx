import React from "react";
import { GameMarkerSettings } from "../types";

interface GameIconToggleProps {
  availableTypes: string[];
  gameMarkerSettings: GameMarkerSettings;
  onToggleMarkerType: (type: string) => void;
  showRegions: boolean;
  hasRegions: boolean;
  onToggleRegions: () => void;
}

export const GameIconToggle: React.FC<GameIconToggleProps> = ({
  availableTypes,
  gameMarkerSettings,
  onToggleMarkerType,
  showRegions,
  hasRegions,
  onToggleRegions,
}) => {
  return (
    <div className="game-icon-toggle-panel">
      {/* 지역 토글 버튼 */}
      {hasRegions && (
        <button
          key="regions"
          className={`game-icon-toggle ${showRegions ? "active" : "inactive"}`}
          onClick={onToggleRegions}
          title={`지역 경계 ${showRegions ? "숨기기" : "표시"}`}
        >
          <span
            className="game-icon-emoji"
            style={{
              color: showRegions ? "#2ecc71" : "#999",
              opacity: showRegions ? 1 : 0.5,
            }}
          >
            🗺️
          </span>
        </button>
      )}

      {/* 구분선 */}
      {hasRegions && availableTypes.length > 0 && (
        <div className="toggle-separator"></div>
      )}

      {/* 마커 토글 버튼들 */}
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
