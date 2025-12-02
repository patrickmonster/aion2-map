import React from "react";
import { MapContainer } from "react-leaflet";
import L from "leaflet";
import { AionTileLayer } from "./AionTileLayer";
import { MapClickHandler } from "./MapClickHandler";
import { AION_MAPS } from "../constants";

interface MapContainerComponentProps {
  selectedMap: string;
  onMapClick: (position: [number, number]) => void;
  mapRef: React.RefObject<L.Map | null>;
  children?: React.ReactNode;
}

export const MapContainerComponent: React.FC<MapContainerComponentProps> = ({
  selectedMap,
  onMapClick,
  mapRef,
  children,
}) => {
  if (!selectedMap) {
    return <div>Loading...</div>;
  }

  const mapInfo = AION_MAPS[selectedMap];
  // Leaflet Simple CRS에서는 픽셀 좌표를 사용
  const mapWidth = mapInfo.tileWidth * mapInfo.tilesCountX;
  const mapHeight = mapInfo.tileHeight * mapInfo.tilesCountY;

  // 바운드 설정 (Simple CRS에서 Y축이 반전되므로 주의)
  const bounds: L.LatLngBoundsExpression = [
    [0, 0], // 좌상단
    [mapHeight, mapWidth], // 우하단
  ];

  // 맵 중앙 좌표 계산
  const center: [number, number] = [(mapHeight / 2) * -1, mapWidth / 2];

  return (
    <div className="leaflet-map-wrapper">
      <MapContainer
        key={selectedMap} // 맵 변경 시 컴포넌트 리렌더링
        ref={mapRef}
        center={center}
        bounds={bounds}
        attributionControl={false}
        zoomSnap={0.25}
        zoomDelta={0.25}
        zoom={0}
        minZoom={-3}
        maxZoom={2}
        style={{ height: "100vh", width: "100%" }}
        className="leaflet-map"
        crs={L.CRS.Simple} // 게임 맵용 좌표계 사용
      >
        <AionTileLayer mapName={selectedMap} />
        <MapClickHandler onMapClick={onMapClick} />
        {children}
      </MapContainer>
    </div>
  );
};
