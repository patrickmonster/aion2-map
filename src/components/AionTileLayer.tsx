import L from "leaflet";
import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { AION_MAPS } from "../constants";
import { GameOptions } from "../types";

// 커스텀 타일 레이어 클래스
class CustomTileLayer extends L.TileLayer {
  gameOptions: GameOptions;
  constructor(options: GameOptions) {
    options.noWrap = false;
    options.tileSize = options.selectedMap.tileWidth;
    super("", options);
    this.gameOptions = options;
  }

  getTileUrl(coords: L.Coords): string {
    let { selectedMap } = this.gameOptions,
      x = coords.x,
      y = coords.y;
    // console.log("LOAD ::", x, y);
    y = y + selectedMap.tilesCountY;
    if (
      x < 0 ||
      y < 0 ||
      x >= selectedMap.tilesCountX ||
      y >= selectedMap.tilesCountY
    ) {
      return "";
    }

    const basePath = process.env.PUBLIC_URL || "";
    return `${basePath}/WorldMap/${selectedMap.name}/${
      selectedMap.name
    }_${String(x).padStart(2, "0")}_${String(y).padStart(2, "0")}.webp`;
  }
}

// AION 2 커스텀 타일 레이어 컴포넌트
interface AionTileLayerProps {
  mapName: string;
}

export const AionTileLayer: React.FC<AionTileLayerProps> = ({ mapName }) => {
  const map = useMap();

  useEffect(() => {
    if (map) {
      // 기존 타일 레이어 제거
      map.eachLayer((layer: any) => {
        if (layer instanceof L.TileLayer) {
          map.removeLayer(layer);
        }
      });

      const selectedMap = AION_MAPS[mapName];

      const customLayer = new CustomTileLayer({
        selectedMap,
        noWrap: true,
        maxZoom: map.getMaxZoom(),
        minZoom: map.getMinZoom(),
        maxNativeZoom: 0,
        minNativeZoom: 0,
      });
      customLayer.addTo(map);

      return () => {
        if (map && customLayer) {
          map.removeLayer(customLayer);
        }
      };
    }
  }, [map, mapName]);

  return null;
};
