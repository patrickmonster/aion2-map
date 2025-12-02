import { useState, useEffect, useCallback } from "react";
import { MarkerType } from "../types";
import { DEFAULT_MARKER_TYPES } from "../constants";

// 마커 타입 관리 훅
export const useMarkerTypes = () => {
  const [markerTypes, setMarkerTypes] =
    useState<MarkerType[]>(DEFAULT_MARKER_TYPES);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 로컬스토리지에서 마커 타입 데이터 로드
  useEffect(() => {
    const savedMarkerTypes = localStorage.getItem("aion2-map-marker-types");
    if (savedMarkerTypes) {
      try {
        const parsed = JSON.parse(savedMarkerTypes);
        setMarkerTypes(parsed);
      } catch (error) {
        console.error("Failed to load marker types:", error);
      }
    }
    setIsInitialLoad(false);
  }, []);

  // 마커 타입 변경 시 로컬스토리지에 저장
  useEffect(() => {
    if (!isInitialLoad) {
      localStorage.setItem(
        "aion2-map-marker-types",
        JSON.stringify(markerTypes)
      );
    }
  }, [markerTypes, isInitialLoad]);

  // 마커 타입 저장 (추가/수정)
  const saveMarkerType = useCallback(
    (markerType: MarkerType, editingId?: string) => {
      if (editingId) {
        setMarkerTypes((prev) =>
          prev.map((type) => (type.id === editingId ? markerType : type))
        );
      } else {
        setMarkerTypes((prev) => [...prev, markerType]);
      }
    },
    []
  );

  // 마커 타입 삭제
  const deleteMarkerType = useCallback((typeId: string) => {
    if (typeId === "default") {
      return false; // 기본 타입은 삭제할 수 없음
    }
    setMarkerTypes((prev) => prev.filter((type) => type.id !== typeId));
    return true;
  }, []);

  return {
    markerTypes,
    saveMarkerType,
    deleteMarkerType,
  };
};
