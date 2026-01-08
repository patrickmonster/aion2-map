import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { CalculatorItemData, ShopItem } from '../../hooks';
import { useCalculatorData, useShopData } from '../../hooks';
import AddCalculatorItemModal from './AddCalculatorItemModal';
import './OptimizationContent.css';
import TypeSelector, { type ItemType } from './TypeSelector';

interface InventoryItem {
  id: string;
  quantity: number;
}

interface CraftableItem extends CalculatorItemData {
  canCraft: boolean;
  missingMaterials: number;
  missingMaterialDetails: { itemId: string; needed: number; have: number }[];
}

const OptimizationContent: React.FC = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(true);

  // 제작 가능 아이템 필터 상태
  const [craftableSearchTerm, setCraftableSearchTerm] = useState('');
  const [craftableTypeFilter, setCraftableTypeFilter] = useState<ItemType>('전체');

  // 커스텀 훅 사용
  const { shopItems: hookShopItems, initializeData } = useShopData();

  const { loadCalculatorData } = useCalculatorData();

  // hookShopItems가 변경될 때 shopItems 업데이트
  useEffect(() => {
    setShopItems(hookShopItems);
  }, [hookShopItems]);

  // 초기 데이터 로드
  useEffect(() => {
    const loadShopData = async () => {
      try {
        setIsLoading(true);
        await initializeData();
        // setError(null);
      } catch (err) {
        console.error('Failed to load shop data:', err);
        // setError('상점 데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadShopData();
  }, [initializeData]);

  // 로컬 스토리지에서 인벤토리 아이템 로드
  useEffect(() => {
    const loadInventory = () => {
      try {
        const saved = localStorage.getItem('inventory-items');
        if (saved) {
          setInventoryItems(JSON.parse(saved));
        }
      } catch (err) {
        console.error('Failed to load inventory:', err);
      }
    };
    loadInventory();
  }, []);

  // 아이템 ID로 상점 아이템 찾기
  const getItemById = useCallback(
    (id: string): ShopItem | undefined => {
      return shopItems.find(item => item.id === id);
    },
    [shopItems]
  );

  // 인벤토리 아이템 저장
  const saveInventory = useCallback((items: InventoryItem[]) => {
    localStorage.setItem('inventory-items', JSON.stringify(items));
    setInventoryItems(items);
  }, []);

  // 인벤토리 아이템 추가
  const handleAddInventoryItem = useCallback(
    (selectedShopItems: ShopItem[]) => {
      const newItems = [...inventoryItems];
      let addedCount = 0;

      selectedShopItems.forEach(shopItem => {
        const existing = newItems.find(item => item.id === shopItem.id);
        if (!existing) {
          newItems.push({ id: shopItem.id, quantity: 1 });
          addedCount++;
        }
      });

      if (addedCount > 0) {
        saveInventory(newItems);
        alert(`${addedCount}개의 아이템이 추가되었습니다.`);
      } else {
        alert('선택한 아이템이 모두 이미 추가되어 있습니다.');
      }

      setIsAddModalOpen(false);
    },
    [inventoryItems, saveInventory]
  );

  // 인벤토리 아이템 수량 변경
  const handleQuantityChange = useCallback(
    (id: string, quantity: number) => {
      const newItems = inventoryItems.map(item => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item));
      saveInventory(newItems);
    },
    [inventoryItems, saveInventory]
  );

  // 인벤토리 아이템 삭제
  const handleRemoveItem = useCallback(
    (id: string) => {
      const newItems = inventoryItems.filter(item => item.id !== id);
      saveInventory(newItems);
    },
    [inventoryItems, saveInventory]
  );

  // 인벤토리 맵 생성
  const inventoryMap = useMemo(() => {
    const map = new Map<string, number>();
    inventoryItems.forEach(item => {
      map.set(item.id, item.quantity);
    });
    return map;
  }, [inventoryItems]);

  // 모든 카테고리의 계산기 데이터 로드
  const allCalculatorItems = useMemo(() => {
    const categories = ['alchemy', 'armor', 'blacksmith', 'handicrafting', 'food'];
    const allItems: CalculatorItemData[] = [];

    categories.forEach(category => {
      const items = loadCalculatorData(category);
      allItems.push(...items);
    });

    return allItems;
  }, [loadCalculatorData]);

  // 제작 가능한 아이템 계산
  const craftableItems = useMemo(() => {
    const items: CraftableItem[] = allCalculatorItems.map(item => {
      const missingMaterialDetails: { itemId: string; needed: number; have: number }[] = [];
      // let totalMissing = 0;

      if (item.materials && item.materials.length > 0) {
        item.materials.forEach(material => {
          const have = inventoryMap.get(material.itemId) || 0;
          const needed = material.quantity;

          if (have < needed) {
            missingMaterialDetails.push({
              itemId: material.itemId,
              needed,
              have,
            });
            // totalMissing += needed - have;
          }
        });
      }

      return {
        ...item,
        canCraft: missingMaterialDetails.length === 0,
        missingMaterials: missingMaterialDetails.length,
        missingMaterialDetails,
      };
    });

    // 제작 가능한 아이템 우선, 그 다음 재료가 2개까지 부족한 아이템
    return items
      .filter(item => item.canCraft || (item.missingMaterials > 0 && item.missingMaterials <= 2))
      .sort((a, b) => {
        if (a.canCraft && !b.canCraft) return -1;
        if (!a.canCraft && b.canCraft) return 1;
        return a.missingMaterials - b.missingMaterials;
      });
  }, [allCalculatorItems, inventoryMap]);

  // 필터링된 제작 가능 아이템
  const filteredCraftableItems = useMemo(() => {
    const searchLower = craftableSearchTerm.toLowerCase();

    return craftableItems.filter(item => {
      // 이름 검색
      if (craftableSearchTerm !== '' && !item.name.toLowerCase().includes(searchLower)) {
        return false;
      }

      // 타입 필터
      if (craftableTypeFilter !== '전체' && item.type !== craftableTypeFilter) {
        return false;
      }

      return true;
    });
  }, [craftableItems, craftableSearchTerm, craftableTypeFilter]);

  return (
    <div className="optimization-content">
      {/* 인벤토리 아이템 섹션 */}

      {/* 로딩 및 에러 상태 */}
      {isLoading ? (
        <div className="loading-shop-data">상점 데이터 로딩 중...</div>
      ) : (
        <>
          <div className="inventory-section">
            <div className="section-header">
              <h3>인벤토리 아이템</h3>
              <button className="btn-add" onClick={() => setIsAddModalOpen(true)}>
                + 아이템 추가
              </button>
            </div>

            <div className="inventory-grid">
              {inventoryItems.length === 0 ? (
                <div className="empty-inventory">아이템을 추가해주세요</div>
              ) : (
                inventoryItems.map(invItem => {
                  const shopItem = getItemById(invItem.id);
                  if (!shopItem) return null;

                  return (
                    <div key={invItem.id} className="inventory-card">
                      <div className="card-header">
                        <span className="item-name">{shopItem.name}</span>
                        <button className="btn-remove" onClick={() => handleRemoveItem(invItem.id)} title="삭제">
                          ×
                        </button>
                      </div>
                      <div className="card-body">
                        <span className="item-type">{shopItem.type}</span>
                        <div className="quantity-control">
                          <label>수량:</label>
                          <input type="number" min="1" value={invItem.quantity} onChange={e => handleQuantityChange(invItem.id, parseInt(e.target.value) || 1)} className="quantity-input" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 구분선 */}
          <div className="section-divider"></div>

          {/* 제작 가능 아이템 섹션 */}
          <div className="craftable-section">
            <div className="section-header">
              <div className="section-header-left">
                <h3>제작 가능 아이템</h3>
                <span className="item-count">{filteredCraftableItems.length}개 아이템</span>
              </div>
              {/* 제작 가능 아이템 필터 */}
              <div className="craftable-filters">
                <div className="filter-group">
                  <label htmlFor="craftable-search-name">아이템명:</label>
                  <input
                    id="craftable-search-name"
                    type="text"
                    value={craftableSearchTerm}
                    onChange={e => setCraftableSearchTerm(e.target.value)}
                    placeholder="아이템명으로 검색..."
                    className="search-input"
                  />
                </div>
                <div className="filter-group">
                  <TypeSelector value={craftableTypeFilter} onChange={setCraftableTypeFilter} label="타입:" includeAll={true} />
                </div>
              </div>
            </div>

            <div className="craftable-table-container">
              <table className="craftable-table">
                <thead>
                  <tr>
                    <th>상태</th>
                    <th>이름</th>
                    <th>타입</th>
                    <th>제작 수량</th>
                    <th>재료</th>
                    <th>부족 재료</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCraftableItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="no-data">
                        제작 가능한 아이템이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredCraftableItems.map(item => (
                      <tr key={item.id} className={item.canCraft ? 'can-craft' : 'missing-materials'}>
                        <td>
                          <span className={`status-badge ${item.canCraft ? 'craftable' : 'partial'}`}>{item.canCraft ? '제작 가능' : `재료 ${item.missingMaterials}개 부족`}</span>
                        </td>
                        <td>{item.name}</td>
                        <td>{item.type}</td>
                        <td>{item.cnt}</td>
                        <td>
                          {item.materials && item.materials.length > 0 ? (
                            <div className="materials-list">
                              {item.materials.map(material => {
                                const materialItem = getItemById(material.itemId);
                                const have = inventoryMap.get(material.itemId) || 0;
                                return (
                                  <div key={material.itemId} className="material-item">
                                    {materialItem?.name || material.itemId} x{material.quantity} <span className={have >= material.quantity ? 'sufficient' : 'insufficient'}>({have}개 보유)</span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            '재료 없음'
                          )}
                        </td>
                        <td>
                          {item.missingMaterialDetails.length > 0 ? (
                            <div className="missing-materials-list">
                              {item.missingMaterialDetails.map(missing => {
                                const materialItem = getItemById(missing.itemId);
                                return (
                                  <div key={missing.itemId} className="missing-item">
                                    {materialItem?.name || missing.itemId}: {missing.needed - missing.have}개 필요
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 아이템 추가 모달 */}
      {isAddModalOpen && <AddCalculatorItemModal shopData={shopItems} onClose={() => setIsAddModalOpen(false)} onSelect={handleAddInventoryItem} />}
    </div>
  );
};

export default OptimizationContent;
