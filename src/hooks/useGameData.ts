import { useEffect, useState } from "react";
import { GameData, GameMarker, GameRegion, RegionsData } from "../types";

// 기본 게임 마커 설정
const DEFAULT_MARKER_CONFIGS = {
  seal: { color: "#e74c3c", icon: "🔒" },
  teleport: { color: "#3498db", icon: "🌀" },
  occupation: { color: "#f39c12", icon: "⚔️" },
  monolithMaterial: { color: "#9b59b6", icon: "💎" },
  battlefield: { color: "#c0392b", icon: "⚡" },
  hiddenCube: { color: "#8e44ad", icon: "🧊" },
  village: { color: "#27ae60", icon: "🏘️" },
};

// 마커 데이터 전용 훅
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
        const basePath = process.env.PUBLIC_URL || "";
        const response = await fetch(
          `${basePath}/WorldMap/${mapName}/${mapName}.json`
        );

        if (!response.ok) {
          throw new Error(`Failed to load game data: ${response.statusText}`);
        }

        const data: GameData = await response.json();
        console.log("MARKERS ::", data);
        setGameData(data);
      } catch (err) {
        console.error("Error loading marker data:", err);
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

// 지역 데이터 전용 훅
export const useGameRegions = (mapName: string) => {
  const [regions, setRegions] = useState<GameRegion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapName) {
      setRegions([]);
      return;
    }

    const loadRegions = async () => {
      setLoading(true);
      setError(null);

      try {
        const basePath = process.env.PUBLIC_URL || "";
        const response = await fetch(
          `${basePath}/WorldMap/${mapName}/${mapName}_regions.json`
        );

        if (!response.ok) {
          // 지역 데이터가 없는 것은 정상적인 경우이므로 에러로 처리하지 않음
          console.warn(`Regions data not available for ${mapName}`);
          setRegions([]);
          setError(null);
          return;
        }

        const data: RegionsData = await response.json();
        console.log("REGIONS ::", data);
        setRegions(data.regions || []);
      } catch (err) {
        console.warn("Error loading regions data:", err);
        setRegions([]);
        setError(null); // 지역 데이터 로드 실패는 에러로 처리하지 않음
      } finally {
        setLoading(false);
      }
    };

    loadRegions();
  }, [mapName]);

  return {
    regions,
    loading,
    error,
    hasRegions: regions.length > 0,
  };
};
