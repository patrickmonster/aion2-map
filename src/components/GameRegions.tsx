import L from "leaflet";
import React, { useEffect } from "react";
import { useMap } from "react-leaflet";
import { GameRegion } from "../types";

interface GameRegionsProps {
  regions: GameRegion[];
  visible: boolean;
}

export const GameRegions: React.FC<GameRegionsProps> = ({
  regions,
  visible,
}) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !visible) return;

    const regionLayers: L.Layer[] = [];

    regions.forEach((region) => {
      if (!region.borders || region.borders.length === 0) return;

      region.borders.forEach((borderGroup) => {
        if (!borderGroup || borderGroup.length === 0) return;

        console.log(">", borderGroup);

        // 좌표 변환: 게임 좌표계에서 Leaflet Simple CRS로
        const convertedCoords: L.LatLngExpression[] = borderGroup.map(
          (coordsArray) => {
            if (!Array.isArray(coordsArray)) {
              console.warn("Invalid coordinates data:", coordsArray);
              return [0, 0] as L.LatLngExpression;
            }
            return coordsArray as L.LatLngExpression;
          }
        );

        // 폴리곤 생성
        const polygon = L.polygon(convertedCoords, {
          color: "#3498db",
          weight: 2,
          opacity: 0.7,
          fillColor: "#3498db",
          fillOpacity: 0.01,
        });

        // 툴팁 추가
        polygon.bindTooltip(region.name, {
          permanent: false,
          direction: "center",
          className: "region-tooltip",
        });

        // 지도에 추가
        polygon.addTo(map);
        regionLayers.push(polygon);
      });
    });

    // 정리 함수
    return () => {
      regionLayers.forEach((layer) => {
        map.removeLayer(layer);
      });
    };
  }, [map, regions, visible]);

  return null;
};
