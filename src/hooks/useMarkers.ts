import { useState, useEffect, useCallback } from "react";
import { MarkerMemo } from "../types";

// 마커 관리 훅
export const useMarkers = () => {
  const [markers, setMarkers] = useState<MarkerMemo[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // 로컬스토리지에서 마커 데이터 로드
  useEffect(() => {
    const savedMarkers = localStorage.getItem("aion2-map-pins");
    if (savedMarkers) {
      try {
        const parsed = JSON.parse(savedMarkers);
        const markersWithDates = parsed.map((marker: any) => ({
          ...marker,
          createdAt: new Date(marker.createdAt),
        }));
        setMarkers(markersWithDates);
      } catch (error) {
        console.error("Failed to load markers:", error);
      }
    }
    setIsInitialLoad(false);
  }, []);

  // 마커 변경 시 로컬스토리지에 저장
  useEffect(() => {
    if (!isInitialLoad && markers.length >= 0) {
      localStorage.setItem("aion2-map-pins", JSON.stringify(markers));
    }
  }, [markers, isInitialLoad]);

  // 마커 추가/수정
  const saveMarker = useCallback((marker: MarkerMemo) => {
    setMarkers((prev) => {
      const existingIndex = prev.findIndex((m) => m.id === marker.id);
      if (existingIndex >= 0) {
        // 수정
        return prev.map((m) => (m.id === marker.id ? marker : m));
      } else {
        // 추가
        return [...prev, marker];
      }
    });
  }, []);

  // 마커 삭제
  const deleteMarker = useCallback((markerId: string) => {
    setMarkers((prev) => prev.filter((marker) => marker.id !== markerId));
  }, []);

  // 모든 마커 삭제
  const deleteAllMarkers = useCallback(() => {
    setMarkers([]);
  }, []);

  // 마커 가져오기
  const importMarkers = useCallback((importedMarkers: MarkerMemo[]) => {
    const markersWithDates = importedMarkers.map((marker: any) => ({
      ...marker,
      createdAt: new Date(marker.createdAt),
    }));
    setMarkers((prev) => [...prev, ...markersWithDates]);
  }, []);

  return {
    markers,
    saveMarker,
    deleteMarker,
    deleteAllMarkers,
    importMarkers,
  };
};
