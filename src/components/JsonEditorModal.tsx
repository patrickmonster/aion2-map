import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_MARKER_CONFIGS } from "../constants";

interface GameMarkerData {
  id: string;
  name: string;
  type: string;
  category: string;
  x: number;
  y: number;
  region?: string;
  images?: string[];
}

interface JsonEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMap: string;
  gameData: any;
}

const JsonEditorModal: React.FC<JsonEditorModalProps> = ({
  isOpen,
  onClose,
  selectedMap,
  gameData,
}) => {
  const [markers, setMarkers] = useState<GameMarkerData[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [backupCreated, setBackupCreated] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"table" | "json">("table");

  // 모달이 열릴 때 데이터 로드
  useEffect(() => {
    if (isOpen && gameData?.markers) {
      setMarkers([...gameData.markers]);
      setSearchTerm("");
      setFilterType("all");
      setFilterCategory("all");
      setEditingId(null);
      setBackupCreated(false);
    }
  }, [isOpen, gameData]);

  // 고유 타입과 카테고리 목록 생성
  const uniqueTypes = useMemo(() => {
    return Object.keys(DEFAULT_MARKER_CONFIGS).sort();
  }, []);

  const uniqueCategories = useMemo(() => {
    const categories = new Set(markers.map((marker) => marker.category));
    return Array.from(categories).sort();
  }, [markers]);

  // 필터링된 마커 목록
  const filteredMarkers = useMemo(() => {
    return markers.filter((marker) => {
      const matchesSearch =
        !searchTerm ||
        marker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        marker.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (marker.region &&
          marker.region.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = filterType === "all" || marker.type === filterType;
      const matchesCategory =
        filterCategory === "all" || marker.category === filterCategory;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [markers, searchTerm, filterType, filterCategory]);

  // 마커 수정 핸들러
  const handleMarkerChange = useCallback(
    (id: string, field: keyof GameMarkerData, value: any) => {
      setMarkers((prev) =>
        prev.map((marker) =>
          marker.id === id ? { ...marker, [field]: value } : marker
        )
      );
    },
    []
  );

  // 마커 삭제
  const handleDeleteMarker = useCallback((id: string) => {
    if (window.confirm("이 마커를 삭제하시겠습니까?")) {
      setMarkers((prev) => prev.filter((marker) => marker.id !== id));
    }
  }, []);

  // 새 마커 추가
  const handleAddMarker = useCallback(() => {
    // 현재 필터에서 선택된 타입 사용, "all"이면 첫 번째 타입 사용
    const selectedType =
      filterType !== "all"
        ? filterType
        : Object.keys(DEFAULT_MARKER_CONFIGS)[0] || "teleport";

    // 현재 필터에서 선택된 카테고리 사용, "all"이면 기존 마커들의 첫 번째 카테고리 사용
    const selectedCategory =
      filterCategory !== "all"
        ? filterCategory
        : uniqueCategories.length > 0
        ? uniqueCategories[0]
        : "collection";

    const newMarker: GameMarkerData = {
      id: `new-marker-${Date.now()}`,
      name: "새 마커",
      type: selectedType,
      category: selectedCategory,
      x: 0,
      y: 0,
      region: "",
      images: [],
    };
    setMarkers((prev) => [...prev, newMarker]);
    setEditingId(newMarker.id);
  }, [filterType, filterCategory, uniqueCategories]);

  // 백업 생성
  const createBackup = useCallback(async () => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFileName = `${selectedMap}_backup_${timestamp}.json`;

      const dataStr = JSON.stringify(gameData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = backupFileName;
      link.click();
      URL.revokeObjectURL(url);

      setBackupCreated(true);
      return true;
    } catch (error) {
      console.error("백업 생성 실패:", error);
      alert("백업 생성에 실패했습니다.");
      return false;
    }
  }, [selectedMap, gameData]);

  // 데이터 저장
  const saveJsonFile = useCallback(async () => {
    try {
      setIsSaving(true);

      // 백업이 아직 생성되지 않았다면 백업 생성
      if (!backupCreated) {
        const backupSuccess = await createBackup();
        if (!backupSuccess) return;
      }

      const updatedGameData = {
        ...gameData,
        markers: markers,
      };

      // 로컬 환경에서만 작동 (개발 서버)
      if (process.env.NODE_ENV === "development") {
        const dataStr = JSON.stringify(updatedGameData, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${selectedMap}.json`;
        link.click();
        URL.revokeObjectURL(url);

        alert(
          `${selectedMap}.json 파일이 다운로드되었습니다.\npublic/WorldMap/${selectedMap}/ 폴더에 직접 교체해주세요.`
        );
      } else {
        alert("이 기능은 개발 환경에서만 사용 가능합니다.");
      }
    } catch (error) {
      console.error("저장 오류:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  }, [markers, selectedMap, backupCreated, createBackup, gameData]);

  if (!isOpen) return null;

  return (
    <div className="json-editor-overlay">
      <div className="json-editor-modal">
        <div className="json-editor-header">
          <div className="header-info">
            <h3>게임 마커 에디터</h3>
            <span className="map-info">
              지도: {selectedMap} | 총 {markers.length}개 마커 | 필터링된:{" "}
              {filteredMarkers.length}개
            </span>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="json-editor-content">
          {/* 검색 및 필터 툴바 */}
          <div className="editor-toolbar">
            <div className="toolbar-section">
              <input
                type="text"
                placeholder="🔍 마커 검색 (이름, ID, 지역)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="toolbar-section">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                <option value="all">모든 타입</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="filter-select"
              >
                <option value="all">모든 카테고리</option>
                {uniqueCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div className="toolbar-section">
              <button
                className="view-toggle-btn"
                onClick={() =>
                  setViewMode(viewMode === "table" ? "json" : "table")
                }
              >
                {viewMode === "table" ? "📋 JSON 보기" : "📊 테이블 보기"}
              </button>

              <button className="add-btn" onClick={handleAddMarker}>
                ➕ 마커 추가
              </button>

              <button
                className="backup-btn"
                onClick={createBackup}
                disabled={isSaving}
              >
                💾 백업 생성
              </button>
            </div>
          </div>

          {/* 테이블 뷰 */}
          {viewMode === "table" ? (
            <div className="table-container">
              <table className="markers-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>이름</th>
                    <th>타입</th>
                    <th>카테고리</th>
                    <th>X 좌표</th>
                    <th>Y 좌표</th>
                    <th>지역</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMarkers.map((marker) => (
                    <tr
                      key={marker.id}
                      className={editingId === marker.id ? "editing" : ""}
                    >
                      <td>
                        <input
                          type="text"
                          value={marker.id}
                          onChange={(e) =>
                            handleMarkerChange(marker.id, "id", e.target.value)
                          }
                          className="cell-input id-input"
                          readOnly={editingId !== marker.id}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={marker.name}
                          onChange={(e) =>
                            handleMarkerChange(
                              marker.id,
                              "name",
                              e.target.value
                            )
                          }
                          className="cell-input"
                          readOnly={editingId !== marker.id}
                        />
                      </td>
                      <td>
                        <select
                          value={marker.type}
                          onChange={(e) =>
                            handleMarkerChange(
                              marker.id,
                              "type",
                              e.target.value
                            )
                          }
                          className="cell-select"
                          disabled={editingId !== marker.id}
                        >
                          {uniqueTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          value={marker.category}
                          onChange={(e) =>
                            handleMarkerChange(
                              marker.id,
                              "category",
                              e.target.value
                            )
                          }
                          className="cell-select"
                          disabled={editingId !== marker.id}
                        >
                          {uniqueCategories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          value={marker.x}
                          onChange={(e) =>
                            handleMarkerChange(
                              marker.id,
                              "x",
                              parseFloat(e.target.value)
                            )
                          }
                          className="cell-input number-input"
                          readOnly={editingId !== marker.id}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={marker.y}
                          onChange={(e) =>
                            handleMarkerChange(
                              marker.id,
                              "y",
                              parseFloat(e.target.value)
                            )
                          }
                          className="cell-input number-input"
                          readOnly={editingId !== marker.id}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={marker.region || ""}
                          onChange={(e) =>
                            handleMarkerChange(
                              marker.id,
                              "region",
                              e.target.value
                            )
                          }
                          className="cell-input"
                          readOnly={editingId !== marker.id}
                        />
                      </td>
                      <td>
                        <div className="action-buttons">
                          {editingId === marker.id ? (
                            <button
                              className="save-row-btn"
                              onClick={() => setEditingId(null)}
                            >
                              ✅
                            </button>
                          ) : (
                            <button
                              className="edit-row-btn"
                              onClick={() => setEditingId(marker.id)}
                            >
                              ✏️
                            </button>
                          )}
                          <button
                            className="delete-row-btn"
                            onClick={() => handleDeleteMarker(marker.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* JSON 뷰 */
            <div className="json-view-container">
              <pre className="json-display">
                {JSON.stringify({ markers: filteredMarkers }, null, 2)}
              </pre>
            </div>
          )}

          <div className="editor-info">
            <p>
              ⚠️ <strong>사용법:</strong>
            </p>
            <ul>
              <li>✏️ 버튼을 클릭하여 행을 편집하고 ✅ 버튼으로 저장</li>
              <li>검색창에서 마커 이름, ID, 지역으로 검색 가능</li>
              <li>타입/카테고리 필터로 원하는 마커만 표시</li>
              <li>저장하기 전에 반드시 백업을 생성하세요</li>
            </ul>
          </div>
        </div>

        <div className="json-editor-actions">
          <button className="cancel-btn" onClick={onClose}>
            취소
          </button>
          <button
            className="save-btn"
            onClick={saveJsonFile}
            disabled={isSaving}
          >
            {isSaving ? "저장 중..." : `💾 저장하기 (${markers.length}개 마커)`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default JsonEditorModal;

/* CSS 스타일 */
const styles = `
/* JSON 에디터 모달 스타일 */
.json-editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.json-editor-modal {
  background: #1a1a1a;
  border: 1px solid #444;
  border-radius: 8px;
  width: 95%;
  max-width: 1400px;
  height: 95%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.json-editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #444;
  background: #2a2a2a;
  border-radius: 8px 8px 0 0;
}

.header-info h3 {
  margin: 0;
  color: #fff;
  font-size: 18px;
}

.map-info {
  color: #aaa;
  font-size: 14px;
  margin-top: 4px;
  display: block;
}

.close-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.json-editor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 20px;
  background: #2a2a2a;
  border-bottom: 1px solid #444;
  align-items: center;
}

.toolbar-section {
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-input {
  background: #1a1a1a;
  border: 1px solid #555;
  color: #fff;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  width: 300px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #4f46e5;
}

.filter-select {
  background: #1a1a1a;
  border: 1px solid #555;
  color: #fff;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
  outline: none;
  cursor: pointer;
}

.filter-select:focus {
  border-color: #4f46e5;
}

.view-toggle-btn,
.add-btn,
.backup-btn {
  background: #4f46e5;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  white-space: nowrap;
}

.view-toggle-btn:hover,
.add-btn:hover,
.backup-btn:hover:not(:disabled) {
  background: #4338ca;
}

.add-btn {
  background: #059669;
}

.add-btn:hover {
  background: #047857;
}

.backup-btn:disabled {
  background: #6b7280;
  cursor: not-allowed;
}

.table-container {
  flex: 1;
  overflow: auto;
  padding: 0;
  background: #1a1a1a;
}

.markers-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  color: #fff;
}

.markers-table th {
  background: #2a2a2a;
  padding: 12px 8px;
  text-align: left;
  border-bottom: 1px solid #444;
  position: sticky;
  top: 0;
  font-weight: 600;
  font-size: 12px;
  color: #ccc;
  text-transform: uppercase;
}

.markers-table td {
  padding: 8px;
  border-bottom: 1px solid #333;
  vertical-align: middle;
}

.markers-table tr:hover {
  background: rgba(255, 255, 255, 0.05);
}

.markers-table tr.editing {
  background: rgba(79, 70, 229, 0.1);
  border: 1px solid rgba(79, 70, 229, 0.3);
}

.cell-input,
.cell-select {
  background: transparent;
  border: 1px solid transparent;
  color: #fff;
  padding: 4px 6px;
  border-radius: 3px;
  font-size: 13px;
  width: 100%;
  outline: none;
  transition: all 0.2s;
}

.cell-input:not([readonly]):focus,
.cell-select:not([disabled]):focus {
  background: #2a2a2a;
  border-color: #4f46e5;
}

.cell-input[readonly] {
  cursor: default;
}

.id-input {
  font-family: 'Consolas', monospace;
  font-size: 12px;
  width: 120px;
}

.number-input {
  width: 80px;
  text-align: right;
}

.action-buttons {
  display: flex;
  gap: 4px;
  justify-content: center;
}

.edit-row-btn,
.save-row-btn,
.delete-row-btn {
  background: none;
  border: 1px solid transparent;
  color: #ccc;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 12px;
  transition: all 0.2s;
}

.edit-row-btn:hover {
  background: #4f46e5;
  color: white;
}

.save-row-btn:hover {
  background: #059669;
  color: white;
}

.delete-row-btn:hover {
  background: #ef4444;
  color: white;
}

.json-view-container {
  flex: 1;
  overflow: auto;
  background: #1a1a1a;
  padding: 20px;
}

.json-display {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
  color: #fff;
  background: #111;
  padding: 20px;
  border-radius: 4px;
  border: 1px solid #333;
  overflow: auto;
  white-space: pre;
  margin: 0;
}

.editor-info {
  padding: 15px 20px;
  background: #2a2a2a;
  border-top: 1px solid #444;
  color: #ccc;
}

.editor-info p {
  margin: 0 0 8px 0;
  color: #fbbf24;
}

.editor-info ul {
  margin: 0;
  padding-left: 20px;
}

.editor-info li {
  margin-bottom: 4px;
  font-size: 13px;
}

.json-editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px;
  background: #2a2a2a;
  border-top: 1px solid #444;
  border-radius: 0 0 8px 8px;
}

.cancel-btn,
.save-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #6b7280;
  color: white;
}

.cancel-btn:hover {
  background: #4b5563;
}

.save-btn {
  background: #059669;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #047857;
}

.save-btn:disabled {
  background: #6b7280;
  cursor: not-allowed;
}
`;

// 스타일 주입
if (typeof document !== "undefined") {
  const styleElement =
    document.getElementById("json-editor-styles") ||
    document.createElement("style");
  styleElement.id = "json-editor-styles";
  styleElement.textContent = styles;
  if (!document.getElementById("json-editor-styles")) {
    document.head.appendChild(styleElement);
  }
}
