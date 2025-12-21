import L from "leaflet";
import React, { useMemo } from "react";
import { Marker, Popup } from "react-leaflet";
import { GameMarker, GameMarkerSettings } from "../types";

interface GameMarkersProps {
  gameMarkers: GameMarker[];
  gameMarkerSettings: GameMarkerSettings;
  visibleTypes: Set<string>;
  onReportMarker?: (marker: GameMarker) => void;
}

const createMarkerIcon = (icon: string, color: string) => {
  return L.divIcon({
    html: `<div style="
      font-size: 20px;
      text-align: center;
      line-height: 1;
      color: ${color};
      text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
      filter: drop-shadow(0 0 2px rgba(0,0,0,0.5));
    ">${icon}</div>`,
    iconSize: [25, 25],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
    className: "game-marker-icon",
  });
};

export const GameMarkers: React.FC<GameMarkersProps> = React.memo(({
  gameMarkers,
  gameMarkerSettings,
  visibleTypes,
  onReportMarker,
}) => {
  const filteredMarkers = useMemo(() =>
    gameMarkers.filter((marker) => visibleTypes.has(marker.type)),
    [gameMarkers, visibleTypes]
  );

  const iconCache = useMemo(() => {
    const cache = new Map<string, L.DivIcon>();
    Object.entries(gameMarkerSettings).forEach(([type, config]) => {
      if (config.visible) {
        cache.set(type, createMarkerIcon(config.icon, config.color));
      }
    });
    return cache;
  }, [gameMarkerSettings]);

  return (
    <>
      {filteredMarkers.map((marker) => {
          const config = gameMarkerSettings[marker.type];
          if (!config || !config.visible) return null;

          const customIcon = iconCache.get(marker.type) || createMarkerIcon(config.icon, config.color);

          return (
            <Marker
              key={marker.id}
              position={[marker.y, marker.x]}
              icon={customIcon}
            >
              <Popup>
                <div className="game-marker-popup">
                  <h4>{marker.name || marker.id || "Unknown Location"}</h4>
                  <div className="marker-details">
                    <div>
                      <strong>타입:</strong>{" "}
                      {gameMarkerSettings[marker.type]?.displayName ||
                        marker.type}{" "}
                    </div>
                    <div>
                      <strong>카테고리:</strong> {marker.category}
                    </div>
                    {marker.region && (
                      <div>
                        <strong>지역:</strong> {marker.region}
                      </div>
                    )}
                    <div>
                      <strong>좌표:</strong> ({marker.x.toFixed(0)},{" "}
                      {marker.y.toFixed(0)})
                    </div>
                  </div>
                  {marker.images && marker.images.length > 0 && (
                    <div className="marker-images">
                      {marker.images.map((image, index) => (
                        <img
                          key={index}
                          src={`/${image}`}
                          alt={marker.name || "Marker image"}
                          style={{
                            maxWidth: "200px",
                            maxHeight: "150px",
                            objectFit: "contain",
                            margin: "5px 0",
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ))}
                    </div>
                  )}
                  <div className="marker-actions">
                    <button
                      className="report-btn"
                      onClick={() => onReportMarker?.(marker)}
                      title="마커 정보 신고하기"
                    >
                      🚨 신고하기
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
    </>
  );
});
