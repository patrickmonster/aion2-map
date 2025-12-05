import { useCallback, useState } from "react";

// 계산기 데이터 타입
export interface CalculatorItemData {
  id: string;
  name: string;
  type: string;
  combo: number;
  cnt: number;
  materials: { itemId: string; quantity: number }[];
  lastUpdated: string;
  hasUpperGradeCombination: boolean;
}

// 아이템 오버라이드 타입
export interface ItemOverride {
  combo?: number;
  cnt?: number;
  materials?: { itemId: string; quantity: number }[];
  hasUpperGradeCombination?: boolean;
}

export const useCalculatorData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 로컬 스토리지에서 계산기 데이터 로드
  const loadCalculatorData = useCallback(
    (category: string): CalculatorItemData[] => {
      try {
        const key = `aion2-calculate-${category}`;
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : [];
      } catch (err) {
        console.error(`계산기 데이터 로드 실패 (${category}):`, err);
        return [];
      }
    },
    []
  );

  // 로컬 스토리지에 계산기 데이터 저장
  const saveCalculatorData = useCallback(
    (category: string, data: CalculatorItemData[]) => {
      try {
        const key = `aion2-calculate-${category}`;
        localStorage.setItem(key, JSON.stringify(data));
      } catch (err) {
        console.error(`계산기 데이터 저장 실패 (${category}):`, err);
      }
    },
    []
  );

  // 특정 아이템이 로컬에 있는지 확인
  const hasItemInLocal = useCallback(
    (category: string, itemId: string): boolean => {
      const localData = loadCalculatorData(category);
      return localData.some((item) => item.id === itemId);
    },
    [loadCalculatorData]
  );

  // 서버에서 새로운 데이터 동기화
  const syncCalculatorData = useCallback(
    async (
      category: string,
      recipeFile: string,
      getItemById: (id: string) => any
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        // 로컬 데이터 로드
        const localData = loadCalculatorData(category);
        const localItemIds = new Set(localData.map((item) => item.id));

        // 서버에서 레시피 데이터 로드
        const basePath = process.env.PUBLIC_URL || "";
        const response = await fetch(`${basePath}/Combination/${recipeFile}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const recipeJson = await response.json();
        const serverItems = recipeJson.items || [];

        // 로컬에 없는 새로운 아이템들만 추가
        const newItems: CalculatorItemData[] = [];

        for (const recipe of serverItems) {
          if (!localItemIds.has(recipe.id)) {
            // 아이템 정보 가져오기
            const itemInfo = getItemById(recipe.id);

            if (itemInfo) {
              const newItem: CalculatorItemData = {
                id: recipe.id,
                name: itemInfo.name,
                type: itemInfo.type,
                combo: recipe.combo,
                cnt: recipe.cnt,
                materials: recipe.ingredient || [],
                lastUpdated: new Date().toISOString(),
                hasUpperGradeCombination: false, // 기본값
              };
              newItems.push(newItem);
            }
          }
        }

        // 새로운 아이템이 있으면 로컬 데이터에 추가하고 저장
        if (newItems.length > 0) {
          const updatedData = [...localData, ...newItems];
          saveCalculatorData(category, updatedData);
        }

        return {
          syncedCount: newItems.length,
          totalCount: localData.length + newItems.length,
          newItems,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "동기화 실패";
        setError(errorMessage);
        console.error("계산기 데이터 동기화 실패:", err);
        return {
          syncedCount: 0,
          totalCount: 0,
          newItems: [],
        };
      } finally {
        setIsLoading(false);
      }
    },
    [loadCalculatorData, saveCalculatorData]
  );

  // 개별 아이템 업데이트
  const updateCalculatorItem = useCallback(
    (
      category: string,
      itemId: string,
      updates: Partial<CalculatorItemData>
    ) => {
      const localData = loadCalculatorData(category);
      const updatedData = localData.map((item) =>
        item.id === itemId
          ? { ...item, ...updates, lastUpdated: new Date().toISOString() }
          : item
      );
      saveCalculatorData(category, updatedData);
      return updatedData;
    },
    [loadCalculatorData, saveCalculatorData]
  );

  // 아이템 삭제
  const deleteCalculatorItem = useCallback(
    (category: string, itemId: string) => {
      const localData = loadCalculatorData(category);
      const updatedData = localData.filter((item) => item.id !== itemId);
      saveCalculatorData(category, updatedData);
      return updatedData;
    },
    [loadCalculatorData, saveCalculatorData]
  );

  // 아이템 오버라이드 저장 (임시 수정사항)
  const saveItemOverrides = useCallback(
    (category: string, overrides: Record<string, ItemOverride>) => {
      try {
        const key = `aion2-calculate-${category}-overrides`;
        localStorage.setItem(key, JSON.stringify(overrides));
      } catch (err) {
        console.error(`오버라이드 저장 실패 (${category}):`, err);
      }
    },
    []
  );

  // 아이템 오버라이드 로드
  const loadItemOverrides = useCallback(
    (category: string): Record<string, ItemOverride> => {
      try {
        const key = `aion2-calculate-${category}-overrides`;
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : {};
      } catch (err) {
        console.error(`오버라이드 로드 실패 (${category}):`, err);
        return {};
      }
    },
    []
  );

  // 카테고리별 파일명 매핑
  const getCategoryFileName = useCallback((category: string): string => {
    switch (category) {
      case "alchemy":
        return "alchemy.json";
      case "armor":
        return "armor.json";
      case "blacksmith":
        return "blacksmith.json";
      case "handicrafting":
        return "handicrafting.json";
      default:
        return "alchemy.json";
    }
  }, []);

  return {
    loadCalculatorData,
    saveCalculatorData,
    hasItemInLocal,
    syncCalculatorData,
    updateCalculatorItem,
    deleteCalculatorItem,
    saveItemOverrides,
    loadItemOverrides,
    getCategoryFileName,
    isLoading,
    error,
  };
};
