import { useEffect, useState } from "react";
import { GameData, GameMarker } from "../types";

// 기본 게임 마커 설정
const DEFAULT_MARKER_CONFIGS = {
  seal: { color: "#e74c3c", icon: "🔒" },
  teleport: { color: "#3498db", icon: "🌀" },
  occupation: { color: "#f39c12", icon: "⚔️" },
  monolithMaterial: { color: "#9b59b6", icon: "🪶" },
  battlefield: { color: "#c0392b", icon: "⚡" },
  hiddenCube: { color: "#8e44ad", icon: "🧊" },
  village: { color: "#27ae60", icon: "🏘️" },
};

export const useGameData = (mapName: string) => {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapName) return;

    const loadGameData = async () => {
      setLoading(true);
      setError(null);

      try {
        // JSON 파일 경로 - public/WorldMap/{mapName}/{mapName}.json
        const basePath = process.env.PUBLIC_URL || "";
        const response = await fetch(
          `${basePath}/WorldMap/${mapName}/${mapName}.json`
        );

        if (!response.ok) {
          throw new Error(`Failed to load game data: ${response.statusText}`);
        }

        const data: GameData = await response.json();
        console.log("GAME ::", data);

        setGameData(data);
      } catch (err) {
        console.error("Error loading game data:", err);
        setGameData(null);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    loadGameData();
  }, [mapName]);

  // type별로 마커 그룹화
  const getMarkersByType = (): Record<string, GameMarker[]> => {
    if (!gameData) return {};

    return gameData.markers.reduce((acc, marker) => {
      const type = marker.type || "other";
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(marker);
      return acc;
    }, {} as Record<string, GameMarker[]>);
  };

  // 사용 가능한 type 목록 가져오기
  const getAvailableTypes = (): string[] => {
    if (!gameData) return [];

    const types = new Set(
      gameData.markers.map((marker) => marker.type || "other")
    );
    return Array.from(types).sort();
  };

  // type의 기본 설정 가져오기
  const getDefaultConfigForType = (type: string) => {
    const baseConfig = DEFAULT_MARKER_CONFIGS[
      type as keyof typeof DEFAULT_MARKER_CONFIGS
    ] || {
      color: "#95a5a6",
      icon: "❓",
    };

    return {
      ...baseConfig,
      readonly: true,
      displayName: type,
    };
  };

  return {
    gameData,
    loading,
    error,
    getMarkersByType,
    getAvailableTypes,
    getDefaultConfigForType,
  };
};
