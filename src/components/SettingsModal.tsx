import React, { useEffect, useState } from "react";
import { PREDEFINED_ICONS } from "../constants";
import { AppSettings, MarkerType } from "../types";
import { ActionButton } from "./ActionButton";
import { GameMarkerSettingsPanel } from "./GameMarkerSettingsPanel";

// 변경이력 타입 정의
interface UpdateItem {
  version: string;
  description: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  settings: AppSettings;
  markerTypes: MarkerType[];
  markers: any[];
  availableTypes?: string[];
  onClose: () => void;
  onExportMarkers: () => void;
  onImportMarkers: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteAllMarkers: () => void;
  onEditMarkerType: (markerType: MarkerType) => void;
  onDeleteMarkerType: (typeId: string) => void;
  onAddMarkerType: () => void;
  onToggleGameMarkerType?: (type: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  markerTypes,
  markers,
  availableTypes = [],
  onClose,
  onExportMarkers,
  onImportMarkers,
  onDeleteAllMarkers,
  onEditMarkerType,
  onDeleteMarkerType,
  onAddMarkerType,
  onToggleGameMarkerType,
}) => {
  const [updateHistory, setUpdateHistory] = useState<{
    version: string;
    updates: UpdateItem[];
  }>();
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(false);

  // 변경이력 불러오기
  useEffect(() => {
    const fetchUpdateHistory = async () => {
      if (!isOpen) return;

      setIsLoadingUpdates(true);
      try {
        const basePath = process.env.PUBLIC_URL || "";
        const response = await fetch(`${basePath}/Combination/update.json`);
        if (response.ok) {
          const data = await response.json();
          setUpdateHistory(data);
        } else {
          console.error("Failed to fetch update history:", response.status);
        }
      } catch (error) {
        console.error("Error fetching update history:", error);
      } finally {
        setIsLoadingUpdates(false);
      }
    };

    fetchUpdateHistory();
  }, [isOpen]);
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

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="memo-dialog-overlay" onClick={handleOverlayClick}>
      <div className="settings-modal">
        <div className="memo-dialog-header">
          <h3>설정</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="settings-content">
          <div className="settings-section">
            <h4>데이터 관리</h4>
            <div className="setting-buttons">
              <button
                className="export-btn"
                onClick={onExportMarkers}
                disabled={markers.length === 0}
              >
                마커 내보내기
              </button>
              <label className="import-btn">
                마커 가져오기
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportMarkers}
                  style={{ display: "none" }}
                />
              </label>
              <button
                className="delete-all-btn"
                onClick={onDeleteAllMarkers}
                disabled={markers.length === 0}
              >
                모든 마커 삭제
              </button>
            </div>
          </div>

          <div className="settings-section">
            <h4>마커 타입 관리</h4>
            <div className="marker-types-list">
              {markerTypes.map((type) => (
                <div key={type.id} className="marker-type-item">
                  <div className="marker-type-info">
                    <span className="marker-type-icon">{type.icon}</span>
                    <span className="marker-type-name">{type.name}</span>
                    <div
                      className="marker-type-color"
                      style={{ backgroundColor: type.color }}
                    ></div>
                  </div>
                  <div className="marker-type-actions">
                    <ActionButton
                      type="edit"
                      onClick={() => onEditMarkerType(type)}
                    />
                    {type.id !== "default" && (
                      <ActionButton
                        type="delete"
                        onClick={() => onDeleteMarkerType(type.id)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button className="add-marker-type-btn" onClick={onAddMarkerType}>
              + 새 마커 타입 추가
            </button>
          </div>

          {/* 게임 마커 설정 섹션 */}
          {availableTypes.length > 0 && onToggleGameMarkerType && (
            <div className="settings-section">
              <GameMarkerSettingsPanel
                availableTypes={availableTypes}
                gameMarkerSettings={settings.gameMarkers}
                onToggleMarkerType={onToggleGameMarkerType}
              />
            </div>
          )}

          <div className="settings-section">
            <div className="info-section-header">
              <h4>정보</h4>
              <button
                className="discord-invite-btn"
                onClick={() =>
                  window.open("https://discord.gg/wDFHrq5PPV", "_blank")
                }
                title="디스코드 서버 참여"
              >
                💬 디스코드
              </button>
            </div>
            <div className="info-text">
              {isLoadingUpdates ? (
                <p>정보 불러오는 중...</p>
              ) : (
                <p>버전: {updateHistory?.version}</p>
              )}
              <p>제작자: Patrickmonster</p>
            </div>
          </div>
          <div className="settings-section">
            <h4>변경이력</h4>
            <div className="info-text">
              {isLoadingUpdates ? (
                <p>변경이력을 불러오는 중...</p>
              ) : (
                <ul>
                  {updateHistory?.updates
                    .slice()
                    .reverse()
                    .map((update, index) => (
                      <li key={index}>
                        {update.version} - {update.description}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 마커 타입 폼 컴포넌트
interface MarkerTypeFormProps {
  markerType: MarkerType | null;
  onSave: (markerType: MarkerType) => void;
  onCancel: () => void;
}

export const MarkerTypeForm: React.FC<MarkerTypeFormProps> = ({
  markerType,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(markerType?.name || "");
  const [color, setColor] = useState(markerType?.color || "#3388ff");
  const [icon, setIcon] = useState(markerType?.icon || "📍");
  const [description, setDescription] = useState(markerType?.description || "");

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEscKey);
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newMarkerType: MarkerType = {
      id: markerType?.id || `custom-${Date.now()}`,
      name: name.trim(),
      color,
      icon,
      description: description.trim(),
    };

    onSave(newMarkerType);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="memo-dialog-overlay" onClick={handleOverlayClick}>
      <div className="memo-dialog">
        <div className="memo-dialog-header">
          <h3>{markerType ? "마커 타입 편집" : "새 마커 타입 추가"}</h3>
          <button className="close-btn" onClick={onCancel}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="memo-dialog-content">
            <div className="marker-type-form">
              <div className="form-group">
                <label>
                  <strong>이름:</strong>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="마커 타입 이름"
                    required
                  />
                </label>
              </div>

              <div className="form-group">
                <label>
                  <strong>색상:</strong>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                  />
                </label>
              </div>

              <div className="form-group">
                <label>
                  <strong>아이콘:</strong>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    placeholder="이모지 입력"
                  />
                </label>
                <div className="icon-picker">
                  {PREDEFINED_ICONS.map((predefinedIcon) => (
                    <button
                      key={predefinedIcon}
                      type="button"
                      className={`icon-option ${
                        icon === predefinedIcon ? "selected" : ""
                      }`}
                      onClick={() => setIcon(predefinedIcon)}
                    >
                      {predefinedIcon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>
                  <strong>설명 (선택사항):</strong>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="마커 타입 설명"
                    rows={2}
                  />
                </label>
              </div>

              <div className="marker-type-preview">
                <strong>미리보기:</strong>
                <div className="preview-marker">
                  <span className="preview-icon">{icon}</span>
                  <span className="preview-name">{name || "새 마커 타입"}</span>
                  <div
                    className="preview-color"
                    style={{ backgroundColor: color }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          <div className="memo-dialog-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>
              취소
            </button>
            <button type="submit" className="save-btn" disabled={!name.trim()}>
              {markerType ? "수정" : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
