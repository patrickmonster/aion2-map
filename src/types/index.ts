import L from "leaflet";

// 마커 타입 인터페이스
export interface MarkerType {
  id: string;
  name: string;
  color: string;
  icon: string;
  description?: string;
}

// 마커 메모 인터페이스
export interface MarkerMemo {
  id: string;
  position: [number, number];
  memo: string;
  mapName: string;
  createdAt: Date;
  type?: string; // 마커 타입 ID
}

// 설정 인터페이스
export interface AppSettings {
  showCoordinates: boolean;
  autoSave: boolean;
  darkMode: boolean;
  markerLimit: number;
  animationSpeed: number;
}

// 게임 옵션 인터페이스
export interface GameOptions extends L.TileLayerOptions {
  selectedMap: any;
  minZoom: number;
  maxZoom: number;
  maxNativeZoom: number;
  minNativeZoom: number;
}

// AION 맵 정보 타입
export interface AionMapInfo {
  name: string;
  displayName: string;
  isVisible?: boolean;
  order: number;
  tileHeight: number;
  tileWidth: number;
  tilesCountX: number;
  tilesCountY: number;
}
