import React from "react";
import { MarkerMemo } from "../types";
import { ActionButton } from "./ActionButton";

interface MarkersSidebarProps {
  markers: MarkerMemo[];
  onMoveToMarker: (position: [number, number]) => void;
  onEditMarker: (marker: MarkerMemo) => void;
  onDeleteMarker: (markerId: string) => void;
}

export const MarkersSidebar: React.FC<MarkersSidebarProps> = ({
  markers,
  onMoveToMarker,
  onEditMarker,
  onDeleteMarker,
}) => {
  if (markers.length === 0) {
    return null;
  }

  return (
    <div className="markers-sidebar">
      <div className="markers-header">
        <h4>저장된 메모 ({markers.length})</h4>
      </div>
      <div className="markers-list">
        {markers.map((marker) => (
          <div
            key={marker.id}
            className="marker-item"
            onClick={() => onMoveToMarker(marker.position)}
          >
            <div className="marker-header">
              <small>{marker.createdAt.toLocaleDateString()}</small>
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
        ))}
      </div>
    </div>
  );
};
