import React from "react";
import { AION_MAPS } from "../constants";

interface NavigationProps {
  selectedMap: string;
  onMapChange: (mapName: string) => void;
  onSettingsClick: () => void;
  isAdminMode?: boolean;
  onJsonEditorClick?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  selectedMap,
  onMapChange,
  onSettingsClick,
  isAdminMode = false,
  onJsonEditorClick,
}) => {
  return (
    <div className="map-selector-top">
      <div className="map-title">
        <h2>Mobinogi - aion2</h2>
        <small>Create by. Patrickmonster</small>
      </div>
      <div className="map-controls">
        <select
          value={selectedMap}
          onChange={(e) => onMapChange(e.target.value)}
          className="map-select"
        >
          {Object.values(AION_MAPS).map((mapInfo) => (
            <option key={mapInfo.name} value={mapInfo.name}>
              {mapInfo.displayName}
            </option>
          ))}
        </select>
        {isAdminMode && onJsonEditorClick && (
          <button
            className="admin-btn"
            onClick={onJsonEditorClick}
            title="JSON 에디터 (관리자)"
          >
            📝
          </button>
        )}
        <button className="settings-btn" onClick={onSettingsClick} title="설정">
          ⚙️
        </button>
      </div>
    </div>
  );
};
