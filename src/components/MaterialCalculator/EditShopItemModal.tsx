import React, { useEffect, useState } from "react";
import type { ShopItem } from "../../hooks";

interface EditShopItemModalProps {
  item: ShopItem;
  onClose: () => void;
  onSave: (itemId: string, updatedItem: Partial<ShopItem>) => void;
}

const EditShopItemModal: React.FC<EditShopItemModalProps> = ({
  item,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(item.name);
  const [minPrice, setMinPrice] = useState(item.minPrice || 0);
  const [maxPrice, setMaxPrice] = useState(item.maxPrice || 0);

  useEffect(() => {
    setName(item.name);
    setMinPrice(item.minPrice || 0);
    setMaxPrice(item.maxPrice || 0);
  }, [item]);

  const handleSave = () => {
    const updatedItem: Partial<ShopItem> = {
      name,
      minPrice,
      maxPrice,
    };
    onSave(item.id, updatedItem);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>상점 아이템 수정</h3>
          <button className="modal-close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="item-name">아이템명:</label>
            <input
              id="item-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              placeholder="아이템명을 입력하세요"
            />
          </div>

          <div className="form-group">
            <label htmlFor="min-price">최저가:</label>
            <input
              id="min-price"
              type="number"
              min="0"
              value={minPrice}
              onChange={(e) => setMinPrice(parseInt(e.target.value) || 0)}
              className="form-input"
              placeholder="최저가를 입력하세요"
            />
          </div>

          <div className="form-group">
            <label htmlFor="max-price">최고가:</label>
            <input
              id="max-price"
              type="number"
              min="0"
              value={maxPrice}
              onChange={(e) => setMaxPrice(parseInt(e.target.value) || 0)}
              className="form-input"
              placeholder="최고가를 입력하세요"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            취소
          </button>
          <button className="btn-primary" onClick={handleSave}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditShopItemModal;
