import L from "leaflet";
import "leaflet/dist/leaflet.css";
import React, { useCallback, useEffect, useState } from "react";
import { Marker, Popup } from "react-leaflet";
import "./Home.css";

// 타입, 상수, 훅들 import
import { setupLeafletIcons } from "../constants";
import {
  useMarkers,
  useMarkerTypes,
  useSettings,
  useUrlParams,
} from "../hooks";
import { MarkerMemo, MarkerType } from "../types";

// 컴포넌트들 import
import {
  MapContainerComponent,
  MarkersSidebar,
  MarkerTypeForm,
  MemoDialog,
  Navigation,
  SettingsModal,
} from "../components";

// Leaflet 아이콘 설정
setupLeafletIcons();

const Map: React.FC = () => {
  const mapRef = React.useRef<L.Map>(null);
  const [selectedMap, setSelectedMap] = useState<string>("");

  // 훅들 사용
  const { getUrlParam, setUrlParam } = useUrlParams();
  const { markers, saveMarker, deleteMarker, deleteAllMarkers, importMarkers } =
    useMarkers();
  const { markerTypes, saveMarkerType, deleteMarkerType } = useMarkerTypes();
  const { settings } = useSettings();

  // UI 상태 관리
  const [showMemoDialog, setShowMemoDialog] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<
    [number, number] | null
  >(null);
  const [memoText, setMemoText] = useState("");
  const [editingMarker, setEditingMarker] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedMarkerType, setSelectedMarkerType] =
    useState<string>("default");
  const [editingMarkerType, setEditingMarkerType] = useState<MarkerType | null>(
    null
  );
  const [showMarkerTypeForm, setShowMarkerTypeForm] = useState(false);
  const [markerFilter, setMarkerFilter] = useState<string>("all");

  // 맵 변경 함수
  const handleMapChange = useCallback((mapName: string) => {
    setSelectedMap(mapName);
    setUrlParam("map", mapName);
  }, []);

  // 마커 추가/수정 함수
  const handleMapClick = useCallback((position: [number, number]) => {
    setCurrentPosition(position);
    setMemoText("");
    setEditingMarker(null);
    setShowMemoDialog(true);
  }, []);

  // 메모 저장 함수
  const handleSaveMemo = useCallback(() => {
    if (!currentPosition || !memoText.trim()) return;

    const newMarker: MarkerMemo = {
      id: editingMarker || Date.now().toString(),
      position: currentPosition,
      memo: memoText.trim(),
      mapName: selectedMap,
      type: selectedMarkerType,
      createdAt: new Date(),
    };

    saveMarker(newMarker);

    setShowMemoDialog(false);
    setCurrentPosition(null);
    setMemoText("");
    setEditingMarker(null);
  }, [
    currentPosition,
    memoText,
    selectedMap,
    editingMarker,
    selectedMarkerType,
    saveMarker,
  ]);

  // 마커 편집 함수
  const handleEditMarker = useCallback((marker: MarkerMemo) => {
    setCurrentPosition(marker.position);
    setMemoText(marker.memo);
    setSelectedMarkerType(marker.type || "default");
    setEditingMarker(marker.id);
    setShowMemoDialog(true);
  }, []);

  // 마커 삭제 함수
  const handleDeleteMarker = useCallback(
    (markerId: string) => {
      deleteMarker(markerId);
    },
    [deleteMarker]
  );

  // 마커 위치로 이동 함수
  const handleMoveToMarker = useCallback(
    (position: [number, number]) => {
      if (mapRef.current) {
        mapRef.current.setView(position, 1, {
          animate: true,
          duration: settings.animationSpeed,
        });
      }
    },
    [settings.animationSpeed]
  );

  // 모든 마커 삭제 함수
  const handleDeleteAllMarkers = useCallback(() => {
    if (window.confirm("모든 마커를 삭제하시겠습니까?")) {
      deleteAllMarkers();
    }
  }, [deleteAllMarkers]);

  // 마커 데이터 내보내기
  const handleExportMarkers = useCallback(() => {
    const dataStr = JSON.stringify(markers, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "aion2-map-markers.json";
    link.click();
    URL.revokeObjectURL(url);
  }, [markers]);

  // 마커 데이터 가져오기
  const handleImportMarkers = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedMarkerData = JSON.parse(e.target?.result as string);
          importMarkers(importedMarkerData);
          alert("마커 데이터를 성공적으로 가져왔습니다.");
        } catch (error) {
          alert("마커 데이터 가져오기에 실패했습니다.");
        }
      };
      reader.readAsText(file);
      event.target.value = "";
    },
    [importMarkers]
  );

  // 마커 타입 추가/수정 함수
  const handleSaveMarkerType = useCallback(
    (markerType: MarkerType) => {
      saveMarkerType(markerType, editingMarkerType?.id);
      setEditingMarkerType(null);
      setShowMarkerTypeForm(false);
    },
    [editingMarkerType, saveMarkerType]
  );

  // 마커 타입 삭제 함수
  const handleDeleteMarkerType = useCallback(
    (typeId: string) => {
      if (typeId === "default") {
        alert("기본 마커 타입은 삭제할 수 없습니다.");
        return;
      }

      if (window.confirm("이 마커 타입을 삭제하시겠습니까?")) {
        const success = deleteMarkerType(typeId);
        if (success) {
          // 삭제된 타입을 사용하는 마커들을 기본 타입으로 변경
          const updatedMarkers = markers.map((marker) =>
            marker.type === typeId ? { ...marker, type: "default" } : marker
          );
          // 마커들을 개별적으로 업데이트
          updatedMarkers.forEach((marker) => {
            if (
              marker.type === "default" &&
              markers.find((m) => m.id === marker.id)?.type === typeId
            ) {
              saveMarker(marker);
            }
          });
        }
      }
    },
    [deleteMarkerType, markers, saveMarker]
  );

  // 마커 타입 편집 시작
  const handleEditMarkerType = useCallback((markerType: MarkerType) => {
    setEditingMarkerType(markerType);
    setShowMarkerTypeForm(true);
  }, []);

  // 현재 맵의 마커만 필터링
  const currentMapMarkers = markers.filter(
    (marker) => marker.mapName === selectedMap
  );

  // 마커 타입으로 필터링된 마커
  const filteredMarkers = currentMapMarkers.filter((marker) => {
    if (markerFilter === "all") return true;
    return marker.type === markerFilter;
  });

  useEffect(() => {
    const mapParam = getUrlParam("map") || "World_D_A";
    setSelectedMap(mapParam);
    if (!getUrlParam("map")) {
      setUrlParam("map", mapParam);
    }
  }, []);

  return (
    <div className="map-container">
      <Navigation
        selectedMap={selectedMap}
        onMapChange={handleMapChange}
        onSettingsClick={() => setShowSettingsModal(true)}
      />

      <MapContainerComponent
        selectedMap={selectedMap}
        onMapClick={handleMapClick}
        mapRef={mapRef}
      >
        {/* 필터링된 마커들 렌더링 */}
        {filteredMarkers.map((marker) => {
          // 마커 타입에 따른 커스텀 아이콘 생성
          const markerType =
            markerTypes.find((type) => type.id === marker.type) ||
            markerTypes.find((type) => type.id === "default");
          let customIcon;

          if (markerType && markerType.id !== "default") {
            // 커스텀 마커 타입인 경우 이모지 아이콘 사용
            customIcon = L.divIcon({
              html: `<div style="font-size: 24px; text-align: center; line-height: 1;">${markerType.icon}</div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15],
              popupAnchor: [0, -15],
              className: "custom-marker-icon",
            });
          }
          // 기본 타입이거나 타입이 없는 경우 기본 Leaflet 아이콘 사용

          return (
            <Marker
              key={marker.id}
              position={marker.position}
              {...(customIcon && { icon: customIcon })}
            >
              <Popup>
                <div className="marker-popup">
                  <div className="memo-content">{marker.memo}</div>
                  <div className="memo-actions">
                    <button
                      className="edit-btn"
                      onClick={() => handleEditMarker(marker)}
                    >
                      편집
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteMarker(marker.id)}
                    >
                      삭제
                    </button>
                  </div>
                  <div className="memo-info">
                    <small>
                      {marker.createdAt.toLocaleDateString()}{" "}
                      {marker.createdAt.toLocaleTimeString()}
                    </small>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainerComponent>

      {/* 메모 작성 다이얼로그 */}
      <MemoDialog
        isOpen={showMemoDialog}
        isEditing={!!editingMarker}
        currentPosition={currentPosition}
        memoText={memoText}
        selectedMarkerType={selectedMarkerType}
        markerTypes={markerTypes}
        onClose={() => setShowMemoDialog(false)}
        onMemoTextChange={setMemoText}
        onMarkerTypeChange={setSelectedMarkerType}
        onSave={handleSaveMemo}
      />

      {/* 설정 모달 */}
      <SettingsModal
        isOpen={showSettingsModal}
        settings={settings}
        markerTypes={markerTypes}
        markers={markers}
        onClose={() => setShowSettingsModal(false)}
        onExportMarkers={handleExportMarkers}
        onImportMarkers={handleImportMarkers}
        onDeleteAllMarkers={handleDeleteAllMarkers}
        onEditMarkerType={handleEditMarkerType}
        onDeleteMarkerType={handleDeleteMarkerType}
        onAddMarkerType={() => {
          setEditingMarkerType(null);
          setShowMarkerTypeForm(true);
        }}
      />

      {/* 마커 목록 사이드바 */}
      <MarkersSidebar
        markers={currentMapMarkers}
        markerTypes={markerTypes}
        selectedFilter={markerFilter}
        onFilterChange={setMarkerFilter}
        onMoveToMarker={handleMoveToMarker}
        onEditMarker={handleEditMarker}
        onDeleteMarker={handleDeleteMarker}
      />

      {/* 마커 타입 추가/편집 폼 */}
      {showMarkerTypeForm && (
        <MarkerTypeForm
          markerType={editingMarkerType}
          onSave={handleSaveMarkerType}
          onCancel={() => {
            setShowMarkerTypeForm(false);
            setEditingMarkerType(null);
          }}
        />
      )}
    </div>
  );
};

export default Map;
