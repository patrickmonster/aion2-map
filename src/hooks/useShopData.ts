import { useCallback } from "react";
import { useStorage } from "./useStorage";

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
  convert?: boolean;
}

// JSON 파일 구조
export interface ShopsJsonData {
  category: string;
  description: string;
  items: ShopItem[];
}

export const useShopData = () => {
  const {
    data: shopItems,
    isLoading,
    error,
    loadServerData,
    loadLocalData,
    saveLocalData,
    initializeData,
  } = useStorage<ShopItem[]>({
    url: `/Combination/shops.json`,
    localKey: "aion2-shop-items",
  });

  // ID로 아이템 정보 가져오기
  const getItemById = useCallback(
    (id: string): ShopItem | undefined =>
      shopItems?.find((item) => item.id === id),
    [shopItems]
  );

  return {
    shopItems: shopItems ?? [],
    loadServerData,
    loadLocalData,
    saveLocalData,
    getItemById,
    initializeData,
    isLoading,
    error,
  };
};
