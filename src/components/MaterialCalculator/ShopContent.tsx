import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ShopItem } from "../../hooks";
import { useShopData } from "../../hooks";
import { ShopsJsonData } from "../../hooks/useShopData";
import { encodeBase32 } from "../../utils/base32";
import TypeSelector, { ItemType } from "./TypeSelector";

interface ShopContentProps {
  className?: string;
}

const ShopContent: React.FC<ShopContentProps> = () => {
  // 검색 조건 상태
  const [searchName, setSearchName] = useState("");
  const [searchType, setSearchType] = useState<ItemType>("전체");
  const [showConvertOnly, setShowConvertOnly] = useState(false);

  // 편집 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);

  // 마지막으로 선택한 타입 기억
  const [lastSelectedType, setLastSelectedType] = useState<ItemType>("기타");

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Event handlers
  const handleSearchNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchName(e.target.value);
  }, []);

  const handleSearchTypeChange = useCallback((type: ItemType) => {
    setSearchType(type);
  }, []);

  const handleShowConvertOnlyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setShowConvertOnly(e.target.checked);
  }, []);

  // 상점 아이템 데이터
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);

  // 동기화 상태
  const [isSyncing, setIsSyncing] = useState(false);

  // 커스텀 훅 사용
  const {
    shopItems: hookShopItems,
    loadServerData,
    saveLocalData,
    initializeData,
    isLoading: hookIsLoading,
    error: hookError,
  } = useShopData();

  // 초기 데이터 로드
  useEffect(() => {
    const loadShopData = async () => {
      try {
        setIsLoading(true);
        await initializeData();
        setError(null);
      } catch (err) {
        console.error("Failed to load shop data:", err);
        setError("상점 데이터를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadShopData();
  }, [initializeData]);

  // hookShopItems가 변경될 때 shopItems 업데이트
  useEffect(() => {
    setShopItems(hookShopItems);
  }, [hookShopItems]);

  // 훅의 로딩/에러 상태 반영
  useEffect(() => {
    setIsLoading(hookIsLoading);
    setError(hookError);
  }, [hookIsLoading, hookError]);

  // 필터링된 아이템 목록
  const filteredItems = useMemo(() => {
    return shopItems.filter((item) => {
      // 이름 검색
      if (
        searchName &&
        !item.name.toLowerCase().includes(searchName.toLowerCase())
      ) {
        return false;
      }

      // 타입 검색
      if (searchType !== "전체" && item.type !== searchType) {
        return false;
      }

      // 재료변환 필터
      if (showConvertOnly && !item.convert) {
        return false;
      }

      return true;
    });
  }, [shopItems, searchName, searchType, showConvertOnly]);

  // CRUD 기능들
  const handleAdd = useCallback(() => {
    setEditingItem({
      id: "",
      name: "",
      type: lastSelectedType,
      minPrice: 0,
      maxPrice: 0,
      lastUpdated: new Date().toISOString().split("T")[0],
      convert: false,
    });
    setIsAddMode(true);
    setIsEditModalOpen(true);
  }, [lastSelectedType]);

  const handleEdit = useCallback((item: ShopItem) => {
    setEditingItem({ ...item });
    setIsAddMode(false);
    setIsEditModalOpen(true);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      if (window.confirm("이 항목을 삭제하시겠습니까?")) {
        const updatedItems = shopItems.filter((item) => item.id !== id);
        setShopItems(updatedItems);
        saveLocalData(updatedItems);
      }
    },
    [shopItems, saveLocalData]
  );

  const handleSave = useCallback(
    (item: ShopItem) => {
      let updatedItems: ShopItem[];

      // 항목 추가 시 선택한 타입을 기억
      if (isAddMode) {
        setLastSelectedType(item.type);
        const newItem = {
          ...item,
          id: encodeBase32(item.name),
          lastUpdated: new Date().toISOString().split("T")[0],
        };
        updatedItems = [...shopItems, newItem];
        setShopItems(updatedItems);
      } else {
        const updatedItem = {
          ...item,
          id: encodeBase32(item.name),
          lastUpdated: new Date().toISOString().split("T")[0],
        };
        updatedItems = shopItems.map((i) =>
          i.id === item.id ? updatedItem : i
        );
        setShopItems(updatedItems);
      }

      // localStorage에 저장
      saveLocalData(updatedItems);
      setIsEditModalOpen(false);
      setEditingItem(null);
    },
    [isAddMode, shopItems, saveLocalData]
  );

  const handleCancel = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingItem(null);
    setIsAddMode(false);
  }, []);

  // 서버와 동기화 기능
  const handleSync = useCallback(async () => {
    if (
      window.confirm(
        "서버에서 새로운 데이터를 가져와 동기화하시겠습니까?\n(ID가 없는 새 항목만 추가됩니다)"
      )
    ) {
      try {
        setIsSyncing(true);

        // 서버에서 데이터 가져오기
        const serverData = await loadServerData();

        // 현재 로컬 데이터의 ID 목록
        const localIds = new Set(shopItems.map((item) => item.id));

        // ID가 없는 새 항목만 필터링
        const newItems = serverData.filter(
          (serverItem) => !localIds.has(serverItem.id)
        );

        if (newItems.length > 0) {
          const updatedItems = [...shopItems, ...newItems];
          setShopItems(updatedItems);
          saveLocalData(updatedItems);
          alert(`${newItems.length}개의 새로운 항목이 추가되었습니다.`);
        } else {
          alert("추가할 새로운 항목이 없습니다.");
        }
      } catch (err) {
        console.error("동기화 실패:", err);
        alert("서버와 동기화하는데 실패했습니다.");
      } finally {
        setIsSyncing(false);
      }
    }
  }, [shopItems, loadServerData, saveLocalData]);

  // JSON 내보내기 기능
  const handleExportJSON = useCallback(() => {
    const exportData: ShopsJsonData = {
      category: "상점",
      description: "게임 내 상점 정보 데이터",
      items: shopItems.map((item) => {
        const exportItem = { ...item };
        // convert가 true인 경우에만 포함
        if (item.convert) {
          exportItem.convert = true;
        } else {
          // convert 속성 제거
          delete exportItem.convert;
        }
        return exportItem;
      }),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `shops-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [shopItems]);

  return (
    <>
      <div className="main-tab-content">
        <div className="content-area">
          <div className="content-header">
            <h3>상점 상품 목록</h3>
            <div className="action-buttons">
              <button onClick={handleAdd} className="btn-primary">
                + 항목 추가
              </button>
              <button
                onClick={handleSync}
                className="btn-sync"
                disabled={isSyncing}
              >
                {isSyncing ? "🔄 동기화 중..." : "🔄 서버 동기화"}
              </button>
              <button onClick={handleExportJSON} className="btn-secondary">
                📁 JSON 내보내기
              </button>
            </div>
          </div>

          {/* 검색 조건 */}
          <div className="search-filters">
            <div className="filter-row">
              <div className="filter-group">
                <label>상품명:</label>
                <input
                  type="text"
                  value={searchName}
                  onChange={handleSearchNameChange}
                  placeholder="상품명 검색"
                  className="search-input"
                />
              </div>

              <div className="filter-group">
                <TypeSelector
                  value={searchType}
                  onChange={handleSearchTypeChange}
                  label="타입:"
                  includeAll={true}
                />
              </div>

              <div className="filter-group">
                <label className="convert-filter-label">
                  <input
                    type="checkbox"
                    checked={showConvertOnly}
                    onChange={handleShowConvertOnlyChange}
                    className="convert-filter-checkbox"
                  />
                  재료변환만 보기
                </label>
              </div>
            </div>
          </div>

          {/* 로딩 및 에러 상태 */}
          {isLoading && (
            <div className="loading-message">데이터를 불러오는 중...</div>
          )}

          {error && <div className="error-message">⚠️ {error}</div>}

          {!isLoading && (
            <div className="table-info">
              총 {filteredItems.length}개의 상품이 검색되었습니다.
            </div>
          )}

          {/* 상품 테이블 */}
          {!isLoading && (
            <div className="shop-table-container">
              <table className="shop-table">
                <thead>
                  <tr>
                    <th>이름</th>
                    <th>타입</th>
                    <th>최소 거래금액</th>
                    <th>최대 거래금액</th>
                    <th>수정일자</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        className={item.convert ? "convert-item" : ""}
                      >
                        <td className="item-name">{item.name}</td>
                        <td className="item-type">{item.type}</td>
                        <td className="price">
                          {item.minPrice.toLocaleString()}
                        </td>
                        <td className="price">
                          {item.maxPrice.toLocaleString()}
                        </td>
                        <td className="date">{item.lastUpdated}</td>
                        <td className="actions">
                          <button
                            onClick={() => handleEdit(item)}
                            className="btn-edit"
                            title="수정"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="btn-delete"
                            title="삭제"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="no-data">
                        검색 조건에 맞는 상품이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && (
            <div className="table-info">
              총 {filteredItems.length}개의 상품이 검색되었습니다.
            </div>
          )}
        </div>
      </div>

      {/* 편집 모달 */}
      {isEditModalOpen && editingItem && (
        <EditModal
          item={editingItem}
          isAddMode={isAddMode}
          onSave={handleSave}
          onCancel={handleCancel}
          existingItems={shopItems}
        />
      )}
    </>
  );
};

// 편집 모달 컴포넌트
interface EditModalProps {
  item: ShopItem;
  isAddMode: boolean;
  onSave: (item: ShopItem) => void;
  onCancel: () => void;
  existingItems: ShopItem[];
}

const EditModal: React.FC<EditModalProps> = ({
  item,
  isAddMode,
  onSave,
  onCancel,
  existingItems,
}) => {
  const [formData, setFormData] = useState<ShopItem>(item);
  const nameInputRef = React.useRef<HTMLInputElement>(null);

  // 항목 추가 모드일 때 상품명 필드에 자동 포커스
  React.useEffect(() => {
    if (isAddMode && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isAddMode]);

  const handleSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name.trim()) {
        alert("상품명을 입력해주세요.");
        return;
      }
      if (formData.minPrice < 0 || formData.maxPrice < 0) {
        alert("가격은 0 이상이어야 합니다.");
        return;
      }

      // 저장할 때 빈 값이 있으면 자동으로 채우기
      let finalMinPrice = formData.minPrice;
      let finalMaxPrice = formData.maxPrice;

      if (finalMinPrice === 0 && finalMaxPrice > 0) {
        finalMinPrice = finalMaxPrice;
      } else if (finalMaxPrice === 0 && finalMinPrice > 0) {
        finalMaxPrice = finalMinPrice;
      }

      if (finalMinPrice > finalMaxPrice) {
        alert("최소 금액이 최대 금액보다 클 수 없습니다.");
        return;
      }

      // ID 중복 확인
      const generatedId = encodeBase32(formData.name);
      const isDuplicate = existingItems.some(
        (existingItem) =>
          existingItem.id === generatedId &&
          (!isAddMode ? existingItem.id !== item.id : true)
      );

      if (isDuplicate) {
        alert(
          `동일한 상품명 "${formData.name}"이 이미 존재합니다.\n다른 상품명을 입력해주세요.`
        );
        return;
      }

      onSave({
        ...formData,
        minPrice: finalMinPrice,
        maxPrice: finalMaxPrice,
      });
    },
    [formData, isAddMode, item.id, existingItems, onSave]
  );

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>{isAddMode ? "항목 추가" : "항목 수정"}</h3>
          <button onClick={onCancel} className="close-button">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>상품명 *</label>
            <input
              ref={nameInputRef}
              type="text"
              value={formData.name}
              onChange={React.useCallback(
                (e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev) => ({
                    ...prev,
                    name: e.target.value,
                    id: encodeBase32(e.target.value),
                  })),
                []
              )}
              className="form-input"
              required
            />
          </div>

          {formData.name && (
            <div className="form-group">
              <label>ID (자동 생성)</label>
              <input
                type="text"
                value={formData.id}
                className="form-input"
                disabled
                style={{ backgroundColor: "#f8f9fa", color: "#6c757d" }}
              />
            </div>
          )}

          <div className="form-group">
            <TypeSelector
              value={formData.type}
              onChange={React.useCallback(
                (type) => setFormData((prev) => ({ ...prev, type })),
                []
              )}
              className="form-select"
              label="타입 *"
              includeAll={false}
              required={true}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>최소 금액 *</label>
              <input
                type="number"
                value={formData.minPrice}
                onChange={React.useCallback(
                  (e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({
                      ...prev,
                      minPrice: parseInt(e.target.value) || 0,
                    })),
                  []
                )}
                className="form-input"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label>최대 금액 *</label>
              <input
                type="number"
                value={formData.maxPrice}
                onChange={React.useCallback(
                  (e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({
                      ...prev,
                      maxPrice: parseInt(e.target.value) || 0,
                    })),
                  []
                )}
                className="form-input"
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.convert || false}
                  onChange={React.useCallback(
                    (e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev) => ({
                        ...prev,
                        convert: e.target.checked,
                      })),
                    []
                  )}
                  className="form-checkbox"
                />
                재료변환 가능
              </label>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="btn-cancel">
              취소
            </button>
            <button type="submit" className="btn-save">
              {isAddMode ? "추가" : "수정"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShopContent;
