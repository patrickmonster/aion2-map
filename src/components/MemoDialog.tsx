import React, { useEffect } from "react";
import { MarkerType } from "../types";

interface MemoDialogProps {
  isOpen: boolean;
  isEditing: boolean;
  currentPosition: [number, number] | null;
  memoText: string;
  selectedMarkerType: string;
  markerTypes: MarkerType[];
  onClose: () => void;
  onMemoTextChange: (text: string) => void;
  onMarkerTypeChange: (typeId: string) => void;
  onSave: () => void;
}

export const MemoDialog: React.FC<MemoDialogProps> = ({
  isOpen,
  isEditing,
  currentPosition,
  memoText,
  selectedMarkerType,
  markerTypes,
  onClose,
  onMemoTextChange,
  onMarkerTypeChange,
  onSave,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !currentPosition) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="memo-dialog-overlay" onClick={handleOverlayClick}>
      <div className="memo-dialog">
        <div className="memo-dialog-header">
          <h3>{isEditing ? "메모 편집" : "새 메모 작성"}</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="memo-dialog-content">
          <div className="position-info">
            <strong>위치:</strong> [{currentPosition[0].toFixed(2)},{" "}
            {currentPosition[1].toFixed(2)}]
          </div>

          <div className="marker-type-selector">
            <label>
              <strong>마커 타입:</strong>
              <select
                value={selectedMarkerType}
                onChange={(e) => onMarkerTypeChange(e.target.value)}
                className="marker-type-select"
              >
                {markerTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.icon} {type.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <textarea
            value={memoText}
            onChange={(e) => onMemoTextChange(e.target.value)}
            placeholder="메모를 입력하세요..."
            className="memo-textarea"
            rows={4}
            autoFocus
          />
        </div>
        <div className="memo-dialog-actions">
          <button className="cancel-btn" onClick={onClose}>
            취소
          </button>
          <button
            className="save-btn"
            onClick={onSave}
            disabled={!memoText.trim()}
          >
            {isEditing ? "수정" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
};
