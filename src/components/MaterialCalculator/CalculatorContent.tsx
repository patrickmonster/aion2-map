import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { CalculatorItemData, ItemOverride, ShopItem } from "../../hooks";
import { useCalculatorData, useRecipeData, useShopData } from "../../hooks";
import AddCalculatorItemModal from "./AddCalculatorItemModal";
import EditMaterialsModal from "./EditMaterialsModal";
import EditShopItemModal from "./EditShopItemModal";
import TypeSelector, { type ItemType } from "./TypeSelector";

// 메인 콘텐츠 탭 타입
type MainContentTab = "연금" | "갑옷" | "대장" | "세공" | "요리";

// 정렬 타입 정의
type SortField =
  | "name"
  | "type"
  | "minPrice"
  | "maxPrice"
  | "minProfit"
  | "maxProfit";
type SortDirection = "asc" | "desc";

interface SortState {
  field: SortField | null;
  direction: SortDirection;
}

// 계산기 아이템 타입 (표시용)
interface CalculatorItem extends Omit<CalculatorItemData, "materials"> {
  minPrice: number;
  maxPrice: number;
  materialCost: number;
  minProfit: number;
  maxProfit: number;
  materials: string; // 표시용 문자열
  materialCount: number;
  ingredient: { itemId: string; quantity: number }[]; // 실제 재료 데이터
}

// 컴포넌트 Props 타입
interface CalculatorContentProps {
  className?: string;
}

// 상수
const MAIN_TABS: MainContentTab[] = ["연금", "갑옷", "대장", "세공", "요리"];
const SORT_ICONS = {
  none: " ⇅",
  asc: " ↑",
  desc: " ↓",
} as const;

const CalculatorContent: React.FC<CalculatorContentProps> = ({ className }) => {
  const [activeMainTab, setActiveMainTab] = useState<MainContentTab>("연금");
  const [shopData, setShopData] = useState<ShopItem[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [materialFilter, setMaterialFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<ItemType>("전체");
  const [excludeConvert, setExcludeConvert] = useState(false);

  // 정렬 상태
  const [sortState, setSortState] = useState<SortState>({
    field: null,
    direction: "asc",
  });

  // 계산 항목 추가 모달 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 사용자 정의 계산 항목들
  const [customCalculatorItems, setCustomCalculatorItems] = useState<
    CalculatorItem[]
  >([]);

  // 커스텀 훅 사용
  const { shopItems, getItemById, initializeData } = useShopData();
  const { getRecipeFileName } = useRecipeData();
  const {
    loadCalculatorData,
    syncCalculatorData,
    updateCalculatorItem,
    deleteCalculatorItem,
    loadItemOverrides,
    saveItemOverrides,
    clearCalculatorData,
    isLoading: isCalculatorLoading,
  } = useCalculatorData();

  // 탭을 카테고리로 변환하는 함수
  const getTabCategory = useCallback((tab: MainContentTab): string => {
    switch (tab) {
      case "연금":
        return "alchemy";
      case "갑옷":
        return "armor";
      case "대장":
        return "blacksmith";
      case "세공":
        return "handicrafting";
      case "요리":
        return "food";
      default:
        return "alchemy";
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      await initializeData();
    };
    initialize();
  }, [initializeData]);

  // 데이터 로드 (로컬 데이터 우선)
  useEffect(() => {
    const loadData = async () => {
      // 상점 데이터 초기화
      // 로컬 스토리지에서 계산기 데이터 로드
      const category = getTabCategory(activeMainTab);
      const localCalculatorData = loadCalculatorData(category);

      // 로컬 데이터를 사용자 정의 아이템으로 설정
      const customItems: CalculatorItem[] = localCalculatorData.map((item) => {
        // 상점에서 실제 가격 가져오기
        const shopItem = getItemById(item.id);
        const minPrice = shopItem?.minPrice || 0;
        const maxPrice = shopItem?.maxPrice || 0;

        // 재료 비용 계산
        let materialMinCost = 0;
        let materialMaxCost = 0;

        if (item.materials && item.materials.length > 0) {
          item.materials.forEach((material) => {
            const materialShopItem = getItemById(material.itemId);
            if (materialShopItem) {
              materialMinCost += materialShopItem.minPrice * material.quantity;
              materialMaxCost += materialShopItem.maxPrice * material.quantity;
            }
          });
        }

        const materialAverageCost = Math.round(
          (materialMinCost + materialMaxCost) / 2
        );
        const minProfit = minPrice * item.cnt - materialMaxCost;
        const maxProfit = maxPrice * item.cnt - materialMinCost;

        // 재료명 포맷팅 (useCallback 함수 대신 직접 구현)
        let materialsText = "재료 없음";
        if (item.materials && item.materials.length > 0) {
          if (item.materials.length === 1) {
            const material = getItemById(item.materials[0].itemId);
            materialsText = material?.name || item.materials[0].itemId;
          } else {
            const firstMaterial = getItemById(item.materials[0].itemId);
            const firstName = firstMaterial?.name || item.materials[0].itemId;

            materialsText = `${firstName} 외 ${item.materials.length - 1}개`;
          }
        }

        return {
          ...item,
          minPrice: minPrice,
          maxPrice: maxPrice,
          materialCost: materialAverageCost,
          minProfit: Math.round(minProfit),
          maxProfit: Math.round(maxProfit),
          materials: materialsText,
          materialCount: item.materials?.length || 0,
          ingredient: item.materials || [],
        };
      });

      setCustomCalculatorItems(customItems);

      // 오버라이드 로드
      const overrides = loadItemOverrides(category);
      setItemOverrides(overrides);
    };

    loadData();
  }, [
    activeMainTab,
    getTabCategory,
    loadCalculatorData,
    loadItemOverrides,
    getItemById,
  ]);

  // shopItems가 변경될 때 shopData 업데이트
  useEffect(() => {
    setShopData(shopItems);
  }, [shopItems]);

  // 재료 편집 모달 상태
  const [isEditMaterialsModalOpen, setIsEditMaterialsModalOpen] =
    useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // 상점 아이템 수정 모달 상태
  const [isEditShopItemModalOpen, setIsEditShopItemModalOpen] = useState(false);
  const [editingShopItem, setEditingShopItem] = useState<ShopItem | null>(null);

  // 모든 아이템의 수정 사항을 저장하는 상태
  const [itemOverrides, setItemOverrides] = useState<
    Record<string, ItemOverride>
  >({});

  // 재료 클릭 핸들러
  const handleMaterialsClick = useCallback((itemId: string) => {
    setEditingItemId(itemId);
    setIsEditMaterialsModalOpen(true);
  }, []);

  // 아이템 삭제 핸들러
  const handleDeleteItem = useCallback(
    (itemId: string) => {
      if (window.confirm("이 아이템을 삭제하시겠습니까?")) {
        const category = getTabCategory(activeMainTab);

        // 로컬 스토리지에서 삭제
        deleteCalculatorItem(category, itemId);

        // itemOverrides에서 삭제
        setItemOverrides((prev) => {
          const newOverrides = { ...prev };
          delete newOverrides[itemId];
          saveItemOverrides(category, newOverrides);
          return newOverrides;
        });

        // customCalculatorItems에서 삭제
        setCustomCalculatorItems((prev) =>
          prev.filter((item) => item.id !== itemId)
        );
      }
    },
    [activeMainTab, getTabCategory, deleteCalculatorItem, saveItemOverrides]
  );

  // 상점 아이템 저장 핸들러
  const handleSaveShopItem = useCallback(
    (itemId: string, updatedItem: Partial<ShopItem>) => {
      setShopData((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, ...updatedItem } : item
        )
      );
    },
    []
  );

  // 수량 변경 핸들러 (모든 항목)
  const handleQuantityChange = useCallback(
    (itemId: string, cnt: number) => {
      const category = getTabCategory(activeMainTab);
      setItemOverrides((prev) => {
        const newOverrides = {
          ...prev,
          [itemId]: {
            ...prev[itemId],
            cnt: Math.max(1, cnt),
          },
        };
        // 로컬 스토리지에 저장
        saveItemOverrides(category, newOverrides);
        return newOverrides;
      });
    },
    [activeMainTab, getTabCategory, saveItemOverrides]
  );

  // 동기화 핸들러
  const handleSyncData = useCallback(async () => {
    const category = getTabCategory(activeMainTab);
    const recipeFile = getRecipeFileName(activeMainTab);

    const result = await syncCalculatorData(category, recipeFile, getItemById);

    if (result.syncedCount > 0) {
      // 새로운 데이터가 동기화되면 다시 로드
      const updatedData = loadCalculatorData(category);
      const customItems: CalculatorItem[] = updatedData.map((item) => ({
        ...item,
        minPrice: 0,
        maxPrice: 0,
        materialCost: 0,
        minProfit: 0,
        maxProfit: 0,
        materials:
          item.materials?.length > 0
            ? `${item.materials.length}개 재료`
            : "재료 없음",
        materialCount: item.materials?.length || 0,
        ingredient: item.materials || [],
      }));
      setCustomCalculatorItems(customItems);

      alert(`${result.syncedCount}개의 새로운 아이템이 동기화되었습니다.`);
    } else {
      alert("동기화할 새로운 데이터가 없습니다.");
    }
  }, [
    activeMainTab,
    getTabCategory,
    getRecipeFileName,
    syncCalculatorData,
    getItemById,
    loadCalculatorData,
  ]);

  // 로컬 데이터 삭제 및 동기화 핸들러
  const handleClearAndSync = useCallback(async () => {
    if (
      !window.confirm("로컬 데이터를 모두 삭제하고 다시 동기화하시겠습니까?")
    ) {
      return;
    }

    const category = getTabCategory(activeMainTab);

    // 로컬 데이터 삭제
    clearCalculatorData(category);

    // 현재 표시된 데이터 초기화
    setCustomCalculatorItems([]);

    // 동기화 진행
    await handleSyncData();
  }, [activeMainTab, clearCalculatorData, getTabCategory, handleSyncData]);

  // 정렬 핸들러
  const handleSort = useCallback((field: SortField) => {
    setSortState((prev) => {
      if (prev.field === field) {
        // 같은 필드를 클릭하면 방향 변경
        return {
          field,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      } else {
        // 다른 필드를 클릭하면 오름차순으로 시작
        return {
          field,
          direction: "asc",
        };
      }
    });
  }, []);

  // 유틸리티 함수
  const getSortIcon = useCallback(
    (field: SortField) => {
      if (sortState.field !== field) return SORT_ICONS.none;
      return sortState.direction === "asc" ? SORT_ICONS.asc : SORT_ICONS.desc;
    },
    [sortState]
  );

  const getItemValue = useCallback(
    (itemId: string, field: keyof ItemOverride, defaultValue: any) => {
      return itemOverrides[itemId]?.[field] ?? defaultValue;
    },
    [itemOverrides]
  );

  // 이윤 계산 함수
  const calculateProfit = useCallback(
    (item: CalculatorItem) => {
      if (!item.ingredient || item.ingredient.length === 0) {
        // 재료가 없으면 전체 가격이 이윤
        return {
          minProfit: item.minPrice * item.cnt,
          maxProfit: item.maxPrice * item.cnt,
        };
      }

      // 재료 비용 계산
      let materialMinCost = 0;
      let materialMaxCost = 0;

      item.ingredient.forEach((material) => {
        // useShopData의 getItemById 사용
        const shopItem = getItemById(material.itemId);
        if (shopItem) {
          materialMinCost += shopItem.minPrice * material.quantity;
          materialMaxCost += shopItem.maxPrice * material.quantity;
        }
      });

      // 이윤 = (판매가 * 수량) - 재료비용
      const minProfit = item.minPrice * item.cnt - materialMaxCost;
      const maxProfit = item.maxPrice * item.cnt - materialMinCost;

      return {
        minProfit: Math.round(minProfit),
        maxProfit: Math.round(maxProfit),
      };
    },
    [getItemById]
  );

  // 선택된 아이템들을 계산 항목으로 추가
  const handleAddCalculatorItem = useCallback(
    (selectedShopItems: ShopItem[]) => {
      const newCalculatorItems: CalculatorItem[] = selectedShopItems.map(
        (selectedShopItem) => ({
          id: selectedShopItem.id,
          name: selectedShopItem.name,
          type: selectedShopItem.type || "기타", // 타입 추가
          minPrice: selectedShopItem.minPrice,
          maxPrice: selectedShopItem.maxPrice,
          materialCost: 0, // 기본값: 재료 없음
          minProfit: selectedShopItem.minPrice, // 초기값: 재료 없을 때 전체 가격이 이익
          maxProfit: selectedShopItem.maxPrice, // 초기값: 재료 없을 때 전체 가격이 이익
          materials: "재료 없음", // 기본값
          materialCount: 1, // 기본값
          combo: 25, // 기본값
          cnt: 1, // 기본값
          ingredient: [], // 기본값
          hasUpperGradeCombination: false,
          lastUpdated: new Date().toISOString().split("T")[0],
        })
      );

      setCustomCalculatorItems((prev) => [...prev, ...newCalculatorItems]);
      setIsAddModalOpen(false);
    },
    []
  );

  // JSON 내보내기 함수 (일단 일반 함수로 선언, 나중에 useCallback 적용)
  const handleExportToJSON = () => {
    const exportData = {
      items: allCalculatorItems.map((item) => ({
        id: item.id,
        level: 1,
        cnt: getItemValue(item.id, "cnt", item.cnt),
        combo: getItemValue(item.id, "combo", item.combo),
        increase: item.hasUpperGradeCombination,
        updatedAt: new Date().toISOString(),
        materials: item.materials,
        ingredient: getItemValue(item.id, "materials", item.ingredient),
      })),
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(dataBlob);
    link.download = `calculator-data-${
      new Date().toISOString().split("T")[0]
    }.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 모든 계산기 아이템은 로컬 데이터(customCalculatorItems)만 사용
  const allCalculatorItems = useMemo(() => {
    return customCalculatorItems;
  }, [customCalculatorItems]);

  // 필터링되고 정렬된 아이템
  const filteredItems = useMemo(() => {
    let items = allCalculatorItems
      .filter((item) => {
        const matchesSearch =
          searchTerm === "" ||
          item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMaterial =
          materialFilter === "" ||
          item.materials.toLowerCase().includes(materialFilter.toLowerCase());
        const matchesType = typeFilter === "전체" || item.type === typeFilter;
        return matchesSearch && matchesMaterial && matchesType;
      })
      .map((item) => {
        // 실시간으로 상점에서 가격 가져오기
        const shopItem = getItemById(item.id);
        const currentMinPrice = shopItem?.minPrice || 0;
        const currentMaxPrice = shopItem?.maxPrice || 0;

        // 각 아이템의 제작비용을 동적으로 계산 (사용자 설정값 반영)
        const overrides = itemOverrides[item.id];
        const materialsToUse = overrides?.materials || item.ingredient;
        const currentQuantity = overrides?.cnt || item.cnt;

        let materialMinCost = 0;
        let materialMaxCost = 0;

        materialsToUse.forEach(
          (material: { itemId: string; quantity: number }) => {
            const materialShopItem = getItemById(material.itemId);
            if (materialShopItem) {
              // 재료변환 제외 필터가 활성화된 경우, convert가 true인 재료는 제외
              if (excludeConvert && materialShopItem.convert) {
                return;
              }
              materialMinCost += materialShopItem.minPrice * material.quantity;
              materialMaxCost += materialShopItem.maxPrice * material.quantity;
            }
          }
        );

        const dynamicMaterialCost = Math.round(
          (materialMinCost + materialMaxCost) / 2
        );
        const dynamicMinProfit =
          currentMinPrice * currentQuantity - materialMaxCost;
        const dynamicMaxProfit =
          currentMaxPrice * currentQuantity - materialMinCost;

        return {
          ...item,
          minPrice: currentMinPrice,
          maxPrice: currentMaxPrice,
          materialCost: dynamicMaterialCost,
          minProfit: Math.round(dynamicMinProfit),
          maxProfit: Math.round(dynamicMaxProfit),
        };
      });

    // 정렬 적용
    if (sortState.field) {
      items = [...items].sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortState.field) {
          case "name":
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case "type":
            aValue = a.type.toLowerCase();
            bValue = b.type.toLowerCase();
            break;
          case "minPrice":
            aValue = a.minPrice;
            bValue = b.minPrice;
            break;
          case "maxPrice":
            aValue = a.maxPrice;
            bValue = b.maxPrice;
            break;
          case "minProfit":
            aValue = a.minProfit;
            bValue = b.minProfit;
            break;
          case "maxProfit":
            aValue = a.maxProfit;
            bValue = b.maxProfit;
            break;
          default:
            return 0;
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          const result = aValue.localeCompare(bValue);
          return sortState.direction === "asc" ? result : -result;
        } else {
          const result = (aValue as number) - (bValue as number);
          return sortState.direction === "asc" ? result : -result;
        }
      });
    }

    return items;
  }, [
    allCalculatorItems,
    searchTerm,
    materialFilter,
    typeFilter,
    sortState,
    itemOverrides,
    getItemById,
    excludeConvert,
  ]);

  return (
    <>
      {/* 메인 탭 네비게이션 */}
      <div className="main-tabs">
        {MAIN_TABS.map((tab) => (
          <button
            key={tab}
            className={`main-tab ${activeMainTab === tab ? "active" : ""}`}
            onClick={() => setActiveMainTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 액션 버튼 */}
      <div className="calculator-header">
        <button
          className="btn-discord-invite"
          onClick={() => window.open("https://discord.gg/wDFHrq5PPV", "_blank")}
          title="디스코드 서버 참여"
        >
          💬 디스코드
        </button>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-add-item"
        >
          + 계산 항목 추가
        </button>
        <button
          onClick={handleSyncData}
          className="btn-sync-data"
          disabled={isCalculatorLoading}
        >
          {isCalculatorLoading ? "동기화 중..." : "🔄 데이터 동기화"}
        </button>
        <button
          onClick={handleClearAndSync}
          className="btn-clear-data"
          disabled={isCalculatorLoading}
        >
          {isCalculatorLoading ? "처리 중..." : "🗑️ 로컬 데이터 삭제"}
        </button>
        <button onClick={handleExportToJSON} className="btn-export-json">
          JSON 내보내기
        </button>
      </div>

      {/* 검색 필터 */}
      <div className="search-filters">
        <div className="search-group">
          <label htmlFor="search-name">상품명:</label>
          <input
            id="search-name"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="상품명으로 검색..."
            className="search-input"
          />
        </div>
        <div className="search-group">
          <label htmlFor="search-material">재료:</label>
          <input
            id="search-material"
            type="text"
            value={materialFilter}
            onChange={(e) => setMaterialFilter(e.target.value)}
            placeholder="재료명으로 검색..."
            className="search-input"
          />
        </div>
        <div className="search-group">
          <TypeSelector
            value={typeFilter}
            onChange={setTypeFilter}
            label="타입:"
            className="search-select"
          />
        </div>
        <div className="search-group">
          <label className="exclude-convert-label">
            <input
              type="checkbox"
              checked={excludeConvert}
              onChange={(e) => setExcludeConvert(e.target.checked)}
              className="exclude-convert-checkbox"
            />
            재료변환 제외 (오드 변환 아이템 제외)
          </label>
        </div>
      </div>

      {/* 메인 탭 콘텐츠 */}
      <div className="main-tab-content">
        <div className="calculator-table-container">
          <table className="calculator-table">
            <thead>
              <tr>
                <th
                  className="sortable"
                  onClick={() => handleSort("name")}
                  style={{ cursor: "pointer" }}
                >
                  이름{getSortIcon("name")}
                </th>
                <th
                  className="sortable"
                  onClick={() => handleSort("type")}
                  style={{ cursor: "pointer" }}
                >
                  타입{getSortIcon("type")}
                </th>
                <th
                  className="sortable"
                  onClick={() => handleSort("minPrice")}
                  style={{ cursor: "pointer" }}
                >
                  최저가{getSortIcon("minPrice")}
                </th>
                <th
                  className="sortable"
                  onClick={() => handleSort("maxPrice")}
                  style={{ cursor: "pointer" }}
                >
                  최고가{getSortIcon("maxPrice")}
                </th>
                <th>제작비용</th>
                <th
                  className="sortable"
                  onClick={() => handleSort("minProfit")}
                  style={{ cursor: "pointer" }}
                >
                  최저이윤{getSortIcon("minProfit")}
                </th>
                <th
                  className="sortable"
                  onClick={() => handleSort("maxProfit")}
                  style={{ cursor: "pointer" }}
                >
                  최고이윤{getSortIcon("maxProfit")}
                </th>
                {/* <th>확률</th> */}
                <th>수량</th>
                <th>재료</th>
                <th>재료개수</th>
                {/* <th>상위등급콤보여부</th> */}
                <th>수정일자</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={`calculate-${item.id}`}>
                    <td>{item.name}</td>
                    <td>{item.type}</td>
                    <td>{item.minPrice.toLocaleString()}원</td>
                    <td>{item.maxPrice.toLocaleString()}</td>
                    <td>{item.materialCost.toLocaleString()}</td>
                    <td
                      className={
                        item.minProfit >= 0
                          ? "profit-positive"
                          : "profit-negative"
                      }
                    >
                      {item.minProfit.toLocaleString()}
                    </td>
                    <td
                      className={
                        item.minProfit >= 0
                          ? "profit-positive"
                          : "profit-negative"
                      }
                    >
                      {item.minProfit.toLocaleString()}
                    </td>
                    {/* <td>
                      <select
                        value={getItemValue(item.id, "combo", item.combo)}
                        onChange={(e) =>
                          handleSuccessRateChange(
                            item.id,
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="inline-edit-select success-rate-select"
                      >
                        {SUCCESS_RATE_OPTIONS.map((rate) => (
                          <option key={rate} value={rate}>
                            {rate}%
                          </option>
                        ))}
                      </select>
                    </td> */}
                    <td>
                      <input
                        type="number"
                        min="1"
                        value={getItemValue(item.id, "cnt", item.cnt)}
                        onChange={(e) =>
                          handleQuantityChange(
                            item.id,
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="inline-edit-input quantity-input"
                      />
                    </td>
                    <td
                      className="materials-cell clickable"
                      onClick={() => handleMaterialsClick(item.id)}
                      title="클릭하여 재료 편집"
                    >
                      {item.materials}
                    </td>
                    <td>{item.materialCount}개</td>
                    {/* <td>
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={getItemValue(
                            item.id,
                            "hasUpperGradeCombination",
                            item.hasUpperGradeCombination
                          )}
                          onChange={() =>
                            handleToggleUpperGradeCombination(item.id)
                          }
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </td> */}
                    <td>{item.lastUpdated}</td>
                    <td className="action-buttons">
                      {/* <button
                        className="btn-edit"
                        onClick={() => handleEditShopItem(item.id)}
                        title="상점 아이템 수정"
                      >
                        수정
                      </button> */}
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteItem(item.id)}
                        title="아이템 삭제"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={14} className="no-data">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 계산 항목 추가 모달 */}
      {isAddModalOpen && (
        <AddCalculatorItemModal
          shopData={shopData}
          onClose={() => setIsAddModalOpen(false)}
          onSelect={handleAddCalculatorItem}
        />
      )}

      {/* 재료 편집 모달 */}
      {isEditMaterialsModalOpen && (
        <EditMaterialsModal
          shopData={shopData}
          getItemById={getItemById}
          itemId={editingItemId}
          currentItem={allCalculatorItems.find(
            (item) => item.id === editingItemId
          )}
          onClose={() => {
            setIsEditMaterialsModalOpen(false);
            setEditingItemId(null);
          }}
          onSave={(itemId, materials) => {
            const category = getTabCategory(activeMainTab);

            // 모든 아이템의 재료 정보를 itemOverrides에 저장
            setItemOverrides((prev) => {
              const newOverrides = {
                ...prev,
                [itemId]: {
                  ...prev[itemId],
                  materials: materials,
                },
              };
              // 로컬 스토리지에 오버라이드 저장
              saveItemOverrides(category, newOverrides);
              return newOverrides;
            });

            // 로컬 스토리지의 원본 데이터 업데이트
            updateCalculatorItem(category, itemId, {
              materials: materials,
              lastUpdated: new Date().toISOString(),
            });

            // 기존 사용자 정의 항목이면 해당 상태도 업데이트
            setCustomCalculatorItems((prev) =>
              prev.map((item) => {
                if (item.id === itemId) {
                  const materialNames = materials.map((m) => {
                    const shopItem = getItemById(m.itemId);
                    return shopItem?.name || m.itemId;
                  });
                  const materialsText =
                    materialNames.length === 1
                      ? materialNames[0]
                      : `${materialNames[0]} 외 ${materialNames.length - 1}개`;
                  const totalQuantity = materials.reduce(
                    (sum, m) => sum + m.quantity,
                    0
                  );
                  // 재료비용 재계산
                  let materialMinCost = 0;
                  let materialMaxCost = 0;
                  materials.forEach((material) => {
                    const shopItem = getItemById(material.itemId);
                    if (shopItem) {
                      materialMinCost += shopItem.minPrice * material.quantity;
                      materialMaxCost += shopItem.maxPrice * material.quantity;
                    }
                  });
                  const materialAverageCost = Math.round(
                    (materialMinCost + materialMaxCost) / 2
                  );

                  const updatedItem = {
                    ...item,
                    materials: materialsText,
                    materialCount: totalQuantity,
                    ingredient: materials,
                    materialCost: materialAverageCost,
                  };
                  // 이윤 재계산
                  const profit = calculateProfit(updatedItem);
                  return {
                    ...updatedItem,
                    minProfit: profit.minProfit,
                    maxProfit: profit.maxProfit,
                  };
                }
                return item;
              })
            );
          }}
        />
      )}

      {/* 상점 아이템 수정 모달 */}
      {isEditShopItemModalOpen && editingShopItem && (
        <EditShopItemModal
          item={editingShopItem}
          onClose={() => {
            setIsEditShopItemModalOpen(false);
            setEditingShopItem(null);
          }}
          onSave={handleSaveShopItem}
        />
      )}
    </>
  );
};

export default CalculatorContent;
