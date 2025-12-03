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

// 게임 마커 데이터 타입
export interface GameMarker {
  category: string;
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  images?: string[];
  region?: string;
}

// 지역 데이터 타입
export interface GameRegion {
  id: string;
  name: string;
  type: string;
  borders: [number, number][][]; // 지역 경계 좌표들
}

// 지역 데이터 인터페이스
export interface RegionsData {
  regions: GameRegion[];
}

// 게임 데이터 인터페이스
export interface GameData {
  markers: GameMarker[];
  regions?: GameRegion[];
}

// 게임 마커 표시 설정
export interface GameMarkerSettings {
  [type: string]: {
    visible: boolean;
    color: string;
    icon: string;
    readonly: boolean; // 읽기 전용 여부
    displayName: string; // 한글 표시명
  };
}

// 설정 인터페이스
export interface AppSettings {
  showCoordinates: boolean;
  autoSave: boolean;
  darkMode: boolean;
  markerLimit: number;
  animationSpeed: number;
  showRegions: boolean;
  gameMarkers: GameMarkerSettings;
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
