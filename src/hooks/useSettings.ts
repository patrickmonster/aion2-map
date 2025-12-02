import { useState, useEffect, useCallback } from "react";
import { AppSettings } from "../types";

const DEFAULT_SETTINGS: AppSettings = {
  showCoordinates: true,
  autoSave: true,
  darkMode: false,
  markerLimit: 100,
  animationSpeed: 1.0,
};

// 설정 관리 훅
export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // 로컬스토리지에서 설정 데이터 로드
  useEffect(() => {
    const savedSettings = localStorage.getItem("aion2-map-settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      } catch (error) {
        console.error("Failed to load settings:", error);
      }
    }
  }, []);

  // 설정 저장
  const saveSettings = useCallback((newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem("aion2-map-settings", JSON.stringify(newSettings));
  }, []);

  // 개별 설정 업데이트
  const updateSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      setSettings((prev) => {
        const newSettings = { ...prev, [key]: value };
        localStorage.setItem("aion2-map-settings", JSON.stringify(newSettings));
        return newSettings;
      });
    },
    []
  );

  return {
    settings,
    saveSettings,
    updateSetting,
  };
};
