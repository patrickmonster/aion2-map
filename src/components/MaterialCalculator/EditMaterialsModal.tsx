import React, { useEffect, useMemo, useState } from 'react';
import type { ShopItem } from '../../hooks';

// CalculatorItem 타입 정의
interface CalculatorItem {
  id: string;
  name: string;
  minPrice: number;
  maxPrice: number;
  minProfit: number;
  maxProfit: number;
  combo: number;
  cnt: number;
  materials: string;
  materialCount: number;
  ingredient: { itemId: string; quantity: number }[];
  hasUpperGradeCombination: boolean;
  lastUpdated: string;
}

interface EditMaterialsModalProps {
  shopData: ShopItem[];
  getItemById: (id: string) => ShopItem | undefined;
  itemId: string | null;
  currentItem?: CalculatorItem;
  onClose: () => void;
  onSave: (itemId: string, materials: { itemId: string; quantity: number }[]) => void;
}

const EditMaterialsModal: React.FC<EditMaterialsModalProps> = ({ shopData, getItemById, itemId, currentItem, onClose, onSave }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMaterials, setSelectedMaterials] = useState<{ itemId: string; quantity: number }[]>([]);

  // 기존 재료 정보로 초기화
  useEffect(() => {
    if (currentItem && currentItem.ingredient && currentItem.ingredient.length > 0) {
      setSelectedMaterials([...currentItem.ingredient]);
    } else {
      setSelectedMaterials([]);
    }
  }, [currentItem]);

  // 필터링된 상점 아이템
  const filteredShopItems = useMemo(() => {
    return shopData.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [shopData, searchQuery]);

  // 재료 추가
  const handleAddMaterial = (shopItem: ShopItem) => {
    const existingMaterial = selectedMaterials.find(m => m.itemId === shopItem.id);
    if (existingMaterial) {
      // 이미 있으면 수량 증가
      setSelectedMaterials(prev => prev.map(m => (m.itemId === shopItem.id ? { ...m, quantity: m.quantity + 1 } : m)));
    } else {
      // 새로 추가
      setSelectedMaterials(prev => [...prev, { itemId: shopItem.id, quantity: 1 }]);
    }
  };

  // 재료 제거
  const handleRemoveMaterial = (itemId: string) => {
    setSelectedMaterials(prev => prev.filter(m => m.itemId !== itemId));
  };

  // 수량 변경
  const handleQuantityChange = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveMaterial(itemId);
      return;
    }
    setSelectedMaterials(prev => prev.map(m => (m.itemId === itemId ? { ...m, quantity } : m)));
  };

  // 저장
  const handleSave = () => {
    if (itemId && selectedMaterials.length > 0) {
      onSave(itemId, selectedMaterials);
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content edit-materials-modal">
        <div className="modal-header">
          <h3>재료 편집 {currentItem && `- ${currentItem.name}`}</h3>
          <div className="header-actions">
            <button onClick={onClose} className="btn-cancel-header">
              취소
            </button>
            <button onClick={handleSave} className="btn-save-header" disabled={selectedMaterials.length === 0}>
              저장
            </button>
          </div>
        </div>

        <div className="modal-body">
          <div className="materials-layout">
            {/* 선택된 재료 목록 */}
            <div className="selected-materials-panel">
              <h4>선택된 재료</h4>
              {selectedMaterials.length > 0 ? (
                <div className="materials-list">
                  {selectedMaterials.map(material => {
                    const shopItem = getItemById(material.itemId);
                    return (
                      <div key={material.itemId} className="material-item">
                        <div className="material-info">
                          <span className="material-name">{shopItem?.name || material.itemId}</span>
                          {shopItem && (
                            <div className="material-price">
                              {shopItem.minPrice.toLocaleString()} ~ {shopItem.maxPrice.toLocaleString()}원
                            </div>
                          )}
                        </div>
                        <div className="material-controls">
                          <input type="number" min="1" value={material.quantity} onChange={e => handleQuantityChange(material.itemId, parseInt(e.target.value) || 1)} className="quantity-input" />
                          <button onClick={() => handleRemoveMaterial(material.itemId)} className="btn-remove" title="제거">
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-materials">재료를 선택해주세요.</div>
              )}
            </div>

            {/* 재료 검색 및 추가 */}
            <div className="search-materials-panel">
              <div className="search-section">
                <label htmlFor="material-search">재료 검색 및 추가:</label>
                <input id="material-search" type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="재료명으로 검색..." className="search-input" />
              </div>

              <div className="items-list">
                {filteredShopItems.length > 0 ? (
                  filteredShopItems.slice(0, 15).map(item => (
                    <div key={item.id} className="item-row clickable" onClick={() => handleAddMaterial(item)}>
                      <div className="item-info">
                        <div className="item-name">{item.name}</div>
                        <div className="item-details">
                          <span className="item-type">{item.type}</span>
                          <span className="item-price">
                            {item.minPrice.toLocaleString()} ~ {item.maxPrice.toLocaleString()}원
                          </span>
                        </div>
                      </div>
                      {selectedMaterials.find(m => m.itemId === item.id) && (
                        <div className="already-selected">
                          선택됨 ({selectedMaterials.find(m => m.itemId === item.id)?.quantity}
                          개)
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="no-results">검색 결과가 없습니다.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditMaterialsModal;
