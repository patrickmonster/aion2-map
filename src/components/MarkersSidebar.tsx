import React from "react";
import { MarkerMemo, MarkerType } from "../types";
import { ActionButton } from "./ActionButton";

interface MarkersSidebarProps {
  markers: MarkerMemo[];
  markerTypes: MarkerType[];
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
  onMoveToMarker: (position: [number, number]) => void;
  onEditMarker: (marker: MarkerMemo) => void;
  onDeleteMarker: (markerId: string) => void;
}

export const MarkersSidebar: React.FC<MarkersSidebarProps> = ({
  markers,
  markerTypes,
  selectedFilter,
  onFilterChange,
  onMoveToMarker,
  onEditMarker,
  onDeleteMarker,
}) => {
  // 마커 타입으로 필터링
  const filteredMarkers = markers.filter((marker) => {
    if (selectedFilter === "all") return true;
    return marker.type === selectedFilter;
  });

  // 마커 타입 찾기 헬퍼 함수
  const getMarkerType = (typeId?: string) => {
    return (
      markerTypes.find((type) => type.id === typeId) ||
      markerTypes.find((type) => type.id === "default")
    );
  };

  if (markers.length === 0) {
    return null;
  }

  return (
    <div className="markers-sidebar">
      <div className="markers-header">
        <h4>
          저장된 메모 ({filteredMarkers.length}/{markers.length})
        </h4>
        <select
          value={selectedFilter}
          onChange={(e) => onFilterChange(e.target.value)}
          className="marker-filter-select"
        >
          <option value="all">모든 타입</option>
          {markerTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.icon} {type.name}
            </option>
          ))}
        </select>
      </div>
      <div className="markers-list">
        {filteredMarkers.map((marker) => {
          const markerType = getMarkerType(marker.type);
          return (
            <div
              key={marker.id}
              className="marker-item"
              onClick={() => onMoveToMarker(marker.position)}
            >
              <div className="marker-header">
                <div className="marker-date-type">
                  {markerType && (
                    <span className="marker-type-icon" title={markerType.name}>
                      {markerType.icon}
                    </span>
                  )}
                  <small>{marker.createdAt.toLocaleDateString()}</small>
                </div>
                <div
                  className="marker-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ActionButton
                    type="edit"
                    onClick={() => onEditMarker(marker)}
                  />
                  <ActionButton
                    type="delete"
                    onClick={() => onDeleteMarker(marker.id)}
                  />
                </div>
              </div>
              <div className="marker-memo">{marker.memo}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
