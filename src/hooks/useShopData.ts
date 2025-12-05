import { useCallback, useState } from "react";

// ItemType import (TypeSelector에서 가져오기)
export type ItemType =
  | "전체"
  | "무기"
  | "방어구"
  | "장신구"
  | "소모품"
  | "외형"
  | "기타"
  | "인게임재화";

// 상점 아이템 타입
export interface ShopItem {
  id: string;
  name: string;
  type: ItemType;
  minPrice: number;
  maxPrice: number;
  lastUpdated: string;
}

// JSON 파일 구조
interface ShopsJsonData {
  category: string;
  description: string;
  items: ShopItem[];
}

export const useShopData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);

  // 서버에서 데이터 로드
  const loadServerData = useCallback(async (): Promise<ShopItem[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const basePath = process.env.PUBLIC_URL || "";
      const response = await fetch(`${basePath}/Combination/shops.json`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ShopsJsonData = await response.json();
      const items = data.items || [];
      setShopItems(items);
      return items;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "서버 데이터 로드 실패";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // localStorage에서 데이터 로드
  const loadLocalData = useCallback((): ShopItem[] => {
    try {
      const savedData = localStorage.getItem("aion2-shop-items");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        return Array.isArray(parsedData) ? parsedData : [];
      }
    } catch (err) {
      console.error("로컬 데이터 로드 실패:", err);
    }
    return [];
  }, []);

  // localStorage에 데이터 저장
  const saveLocalData = useCallback((items: ShopItem[]) => {
    try {
      localStorage.setItem("aion2-shop-items", JSON.stringify(items));
    } catch (err) {
      console.error("로컬 데이터 저장 실패:", err);
    }
  }, []);

  // ID로 아이템 정보 가져오기
  const getItemById = useCallback(
    (id: string): ShopItem | undefined => {
      return shopItems.find((item) => item.id === id);
    },
    [shopItems]
  );

  // 여러 ID로 아이템 정보들 가져오기
  const getItemsByIds = useCallback(
    (ids: string[]): ShopItem[] => {
      return ids
        .map((id) => shopItems.find((item) => item.id === id))
        .filter(Boolean) as ShopItem[];
    },
    [shopItems]
  );

  // 초기 데이터 로드
  const initializeData = useCallback(async () => {
    try {
      // 먼저 로컬 데이터 확인
      const localData = loadLocalData();
      if (localData.length > 0) {
        setShopItems(localData);
        console.log("LOADINMG ::", localData);
        return;
      }

      // 서버에서 최신 데이터 로드
      await loadServerData();
    } catch (err) {
      console.error("데이터 초기화 실패:", err);
    }
  }, [loadLocalData, loadServerData]);

  return {
    shopItems,
    loadServerData,
    loadLocalData,
    saveLocalData,
    getItemById,
    getItemsByIds,
    initializeData,
    isLoading,
    error,
  };
};
