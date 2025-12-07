import React, { useMemo, useState } from "react";
import type { ShopItem } from "../../hooks";

interface AddCalculatorItemModalProps {
  shopData: ShopItem[];
  onClose: () => void;
  onSelect: (items: ShopItem[]) => void;
}

const AddCalculatorItemModal: React.FC<AddCalculatorItemModalProps> = ({
  shopData,
  onClose,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<ShopItem[]>([]);

  // 필터링된 상점 아이템
  const filteredShopItems = useMemo(() => {
    return shopData.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [shopData, searchQuery]);

  const handleItemToggle = (item: ShopItem) => {
    setSelectedItems((prev) => {
      const isSelected = prev.some((selected) => selected.id === item.id);
      if (isSelected) {
        return prev.filter((selected) => selected.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  };

  const handleSelect = () => {
    if (selectedItems.length > 0) {
      onSelect(selectedItems);
    }
  };

  const handleSelectAll = () => {
    const visibleItems = filteredShopItems.slice(0, 20);
    const allSelected = visibleItems.every((item) =>
      selectedItems.some((selected) => selected.id === item.id)
    );

    if (allSelected) {
      // 모두 선택된 상태면 모두 해제
      setSelectedItems((prev) =>
        prev.filter(
          (selected) => !visibleItems.some((item) => item.id === selected.id)
        )
      );
    } else {
      // 일부 또는 없음이면 모두 선택
      const newItems = visibleItems.filter(
        (item) => !selectedItems.some((selected) => selected.id === item.id)
      );
      setSelectedItems((prev) => [...prev, ...newItems]);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content add-item-modal">
        <div className="modal-header">
          <h3>계산 항목 추가 ({selectedItems.length}개 선택)</h3>
          <button onClick={onClose} className="close-button">
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="search-section">
            <label htmlFor="item-search">상점 아이템 검색:</label>
            <input
              id="item-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="아이템 이름으로 검색..."
              className="search-input"
            />
            {filteredShopItems.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="select-all-button"
              >
                {filteredShopItems
                  .slice(0, 20)
                  .every((item) =>
                    selectedItems.some((selected) => selected.id === item.id)
                  )
                  ? "모두 해제"
                  : "모두 선택"}
              </button>
            )}
          </div>

          <div className="items-list">
            {filteredShopItems.length > 0 ? (
              filteredShopItems.slice(0, 20).map((item) => {
                const isSelected = selectedItems.some(
                  (selected) => selected.id === item.id
                );
                return (
                  <div
                    key={item.id}
                    className={`item-row ${isSelected ? "selected" : ""}`}
                    onClick={() => handleItemToggle(item)}
                  >
                    <div className="item-checkbox">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleItemToggle(item)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="item-info">
                      <div className="item-name">{item.name}</div>
                      <div className="item-details">
                        <span className="item-type">{item.type}</span>
                        <span className="item-price">
                          {item.minPrice.toLocaleString()} ~{" "}
                          {item.maxPrice.toLocaleString()}원
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-results">검색 결과가 없습니다.</div>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn-cancel">
            취소
          </button>
          <button
            type="button"
            onClick={handleSelect}
            className="btn-save"
            disabled={selectedItems.length === 0}
          >
            {selectedItems.length > 0
              ? `${selectedItems.length}개 선택`
              : "선택"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCalculatorItemModal;
