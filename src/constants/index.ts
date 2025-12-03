import L from "leaflet";
import { AionMapInfo, GameMarkerSettings, MarkerType } from "../types";

// 게임 마커 기본 설정 (아이콘, 색상 등)
export const DEFAULT_MARKER_CONFIGS = {
  seal: { color: "#e74c3c", icon: "🔒", displayName: "봉인던전" },
  teleport: { color: "#3498db", icon: "🌀", displayName: "귀환석" },
  occupation: { color: "#f39c12", icon: "⚔️", displayName: "점령지" },
  monolithMaterial: { color: "#9b59b6", icon: "🪶", displayName: "닭털" },
  battlefield: { color: "#c0392b", icon: "⚡", displayName: "전장" },
  hiddenCube: { color: "#8e44ad", icon: "🧊", displayName: "히든 큐브" },
  village: { color: "#27ae60", icon: "🏘️", displayName: "마을" },
  fieldboss: { color: "#a10808ff", icon: "👹", displayName: "필드보스" },
};

// 게임 마커 설정 (visible, readonly 포함)
export const DEFAULT_GAME_MARKERS: GameMarkerSettings = Object.keys(
  DEFAULT_MARKER_CONFIGS
).reduce((acc, key) => {
  const config =
    DEFAULT_MARKER_CONFIGS[key as keyof typeof DEFAULT_MARKER_CONFIGS];
  acc[key] = {
    visible: true,
    color: config.color,
    icon: config.icon,
    readonly: true,
    displayName: config.displayName,
  };
  return acc;
}, {} as GameMarkerSettings);

// 기본 마커 타입 데이터
export const DEFAULT_MARKER_TYPES: MarkerType[] = [
  {
    id: "default",
    name: "기본",
    color: "#3388ff",
    icon: "📍",
    description: "기본 마커",
  },
  {
    id: "important",
    name: "중요",
    color: "#ff3333",
    icon: "❗",
    description: "중요한 위치",
  },
];

// 사용 가능한 AION 2 맵 목록
export const AION_MAPS: Record<string, AionMapInfo> = {
  World_D_A: {
    name: "World_D_A",
    displayName: "마족 월드",
    isVisible: true,
    order: 0,
    tileHeight: 1024,
    tileWidth: 1024,
    tilesCountX: 8,
    tilesCountY: 8,
  },
  World_L_A: {
    name: "World_L_A",
    displayName: "천족 월드",
    order: 1,
    tileHeight: 1024,
    tileWidth: 1024,
    tilesCountX: 8,
    tilesCountY: 8,
  },
  World_L_Starter: {
    name: "World_L_Starter",
    displayName: "천족 시작지역",
    order: 2,
    tileHeight: 1024,
    tileWidth: 1024,
    tilesCountX: 5,
    tilesCountY: 5,
  },
  World_D_Starter: {
    displayName: "마족 시작지역",
    name: "World_D_Starter",
    order: 3,
    tileHeight: 1024,
    tileWidth: 1024,
    tilesCountX: 5,
    tilesCountY: 5,
  },
  Abyss_Reshanta_A: {
    name: "Abyss_Reshanta_A",
    displayName: "어비스 리샨타 A",
    order: 4,
    tileHeight: 1024,
    tileWidth: 1024,
    tilesCountX: 4,
    tilesCountY: 4,
  },
  Abyss_Reshanta_B: {
    name: "Abyss_Reshanta_B",
    displayName: "어비스 리샨타 B",
    order: 5,
    tileHeight: 1024,
    tileWidth: 1024,
    tilesCountX: 2,
    tilesCountY: 2,
  },
};

// Leaflet 기본 아이콘 설정
export const setupLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
};

// 미리 정의된 아이콘 목록
export const PREDEFINED_ICONS = ["⭐", "⛏️", "🌿", "🗡️"];
