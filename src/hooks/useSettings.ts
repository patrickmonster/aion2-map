import { useCallback, useEffect, useState } from "react";
import { AppSettings, GameMarkerSettings } from "../types";

const DEFAULT_GAME_MARKERS: GameMarkerSettings = {
  seal: {
    visible: true,
    color: "#e74c3c",
    icon: "🔒",
    readonly: true,
    displayName: "봉인던전",
  },
  teleport: {
    visible: true,
    color: "#3498db",
    icon: "🌀",
    readonly: true,
    displayName: "마을",
  },
  occupation: {
    visible: true,
    color: "#f39c12",
    icon: "⚔️",
    readonly: true,
    displayName: "점령지",
  },
  monolithMaterial: {
    visible: true,
    color: "#9b59b6",
    icon: "🪶",
    readonly: true,
    displayName: "닭털",
  },
  battlefield: {
    visible: true,
    color: "#c0392b",
    icon: "⚡",
    readonly: true,
    displayName: "전장",
  },
  hiddenCube: {
    visible: true,
    color: "#8e44ad",
    icon: "🧊",
    readonly: true,
    displayName: "히든 큐브",
  },
  village: {
    visible: true,
    color: "#27ae60",
    icon: "🏘️",
    readonly: true,
    displayName: "마을",
  },
};

const DEFAULT_SETTINGS: AppSettings = {
  showCoordinates: true,
  autoSave: true,
  darkMode: false,
  markerLimit: 100,
  animationSpeed: 1.0,
  gameMarkers: DEFAULT_GAME_MARKERS,
};

// gameMarkers의 visible 상태만 저장
type GameMarkerVisibilitySettings = {
  [key: string]: boolean;
};

// 설정 관리 훅
export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // 로컬스토리지에서 설정 데이터 로드
  useEffect(() => {
    const savedSettings = localStorage.getItem("aion2-map-settings");
    const savedGameMarkerVisibility = localStorage.getItem(
      "aion2-map-game-markers-visibility"
    );

    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        let gameMarkers = { ...DEFAULT_GAME_MARKERS };

        // gameMarkers visibility 설정 복원
        if (savedGameMarkerVisibility) {
          const visibilitySettings: GameMarkerVisibilitySettings = JSON.parse(
            savedGameMarkerVisibility
          );
          Object.keys(gameMarkers).forEach((key) => {
            if (key in visibilitySettings) {
              gameMarkers[key] = {
                ...gameMarkers[key],
                visible: visibilitySettings[key],
              };
            }
          });
        }

        // 기본 설정과 병합하여 누락된 속성들을 보완
        const mergedSettings = {
          ...DEFAULT_SETTINGS,
          ...parsed,
          gameMarkers,
        };
        setSettings(mergedSettings);
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }
  }, []);

  // 설정 저장
  const saveSettings = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);

    // gameMarkers visible 상태만 별도 저장
    const visibilitySettings: GameMarkerVisibilitySettings = {};
    Object.keys(newSettings.gameMarkers || {}).forEach((key) => {
      visibilitySettings[key] = newSettings.gameMarkers[key]?.visible ?? true;
    });

    // gameMarkers를 제외한 설정만 저장
    const { gameMarkers, ...settingsWithoutGameMarkers } = newSettings;
    localStorage.setItem(
      "aion2-map-settings",
      JSON.stringify(settingsWithoutGameMarkers)
    );
    localStorage.setItem(
      "aion2-map-game-markers-visibility",
      JSON.stringify(visibilitySettings)
    );
  }, []);

  // 개별 설정 업데이트
  const updateSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      setSettings((prev) => {
        const newSettings = { ...prev, [key]: value };

        // gameMarkers visible 상태만 별도 저장
        const visibilitySettings: GameMarkerVisibilitySettings = {};
        Object.keys(newSettings.gameMarkers || {}).forEach((markerKey) => {
          visibilitySettings[markerKey] =
            newSettings.gameMarkers[markerKey]?.visible ?? true;
        });

        // gameMarkers를 제외한 설정만 저장
        const { gameMarkers, ...settingsWithoutGameMarkers } = newSettings;
        localStorage.setItem(
          "aion2-map-settings",
          JSON.stringify(settingsWithoutGameMarkers)
        );
        localStorage.setItem(
          "aion2-map-game-markers-visibility",
          JSON.stringify(visibilitySettings)
        );

        return newSettings;
      });
    },
    []
  );

  // 게임 마커 표시 설정 토글
  const toggleGameMarkerType = useCallback((subtype: string) => {
    setSettings((prev) => {
      const currentGameMarkers = prev.gameMarkers || DEFAULT_GAME_MARKERS;
      const newGameMarkers = {
        ...currentGameMarkers,
        [subtype]: {
          ...currentGameMarkers[subtype],
          visible: !currentGameMarkers[subtype]?.visible,
        },
      };
      const newSettings = { ...prev, gameMarkers: newGameMarkers };

      // visible 상태만 별도 저장
      const visibilitySettings: GameMarkerVisibilitySettings = {};
      Object.keys(newGameMarkers).forEach((key) => {
        visibilitySettings[key] = newGameMarkers[key]?.visible ?? true;
      });

      // 기존 설정 로드
      const savedSettings = localStorage.getItem("aion2-map-settings");
      let baseSettings = {};
      if (savedSettings) {
        try {
          baseSettings = JSON.parse(savedSettings);
        } catch (error) {
          console.error("Failed to parse saved settings:", error);
        }
      }

      // gameMarkers를 제외한 설정 저장
      const { gameMarkers, ...settingsWithoutGameMarkers } = newSettings;
      localStorage.setItem(
        "aion2-map-settings",
        JSON.stringify({ ...baseSettings, ...settingsWithoutGameMarkers })
      );
      localStorage.setItem(
        "aion2-map-game-markers-visibility",
        JSON.stringify(visibilitySettings)
      );

      return newSettings;
    });
  }, []);

  // 새로운 type에 대한 기본 설정 추가
  const initializeGameMarkerType = useCallback(
    (
      type: string,
      defaultConfig: {
        color: string;
        icon: string;
        readonly: boolean;
        displayName: string;
      }
    ) => {
      setSettings((prev) => {
        const currentGameMarkers = prev.gameMarkers || DEFAULT_GAME_MARKERS;
        if (currentGameMarkers[type]) {
          return prev; // 이미 존재하면 변경하지 않음
        }

        const newGameMarkers = {
          ...currentGameMarkers,
          [type]: {
            visible: true,
            ...defaultConfig,
          },
        };
        const newSettings = { ...prev, gameMarkers: newGameMarkers };

        // visible 상태만 별도 저장
        const visibilitySettings: GameMarkerVisibilitySettings = {};
        Object.keys(newGameMarkers).forEach((key) => {
          visibilitySettings[key] = newGameMarkers[key]?.visible ?? true;
        });

        // 기존 설정 로드
        const savedSettings = localStorage.getItem("aion2-map-settings");
        let baseSettings = {};
        if (savedSettings) {
          try {
            baseSettings = JSON.parse(savedSettings);
          } catch (error) {
            console.error("Failed to parse saved settings:", error);
          }
        }

        // gameMarkers를 제외한 설정 저장
        const { gameMarkers, ...settingsWithoutGameMarkers } = newSettings;
        localStorage.setItem(
          "aion2-map-settings",
          JSON.stringify({ ...baseSettings, ...settingsWithoutGameMarkers })
        );
        localStorage.setItem(
          "aion2-map-game-markers-visibility",
          JSON.stringify(visibilitySettings)
        );

        return newSettings;
      });
    },
    []
  );

  return {
    settings,
    saveSettings,
    updateSetting,
    toggleGameMarkerType,
    initializeGameMarkerType,
  };
};
