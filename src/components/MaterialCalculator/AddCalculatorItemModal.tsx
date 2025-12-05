import React, { useMemo, useState } from "react";
import type { ShopItem } from "../../hooks";

interface AddCalculatorItemModalProps {
  shopData: ShopItem[];
  onClose: () => void;
  onSelect: (item: ShopItem) => void;
}

const AddCalculatorItemModal: React.FC<AddCalculatorItemModalProps> = ({
  shopData,
  onClose,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);

  // 필터링된 상점 아이템
  const filteredShopItems = useMemo(() => {
    return shopData.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [shopData, searchQuery]);

  const handleSelect = () => {
    if (selectedItem) {
      onSelect(selectedItem);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content add-item-modal">
        <div className="modal-header">
          <h3>계산 항목 추가</h3>
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
          </div>

          <div className="items-list">
            {filteredShopItems.length > 0 ? (
              filteredShopItems.slice(0, 20).map((item) => (
                <div
                  key={item.id}
                  className={`item-row ${
                    selectedItem?.id === item.id ? "selected" : ""
                  }`}
                  onClick={() => setSelectedItem(item)}
                >
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
              ))
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
            disabled={!selectedItem}
          >
            선택
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCalculatorItemModal;
