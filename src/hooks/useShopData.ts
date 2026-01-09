import { useCallback } from 'react';
import { useStorage } from './useStorage';

// ItemType import (TypeSelector에서 가져오기)
export type ItemType = '전체' | '무기' | '방어구' | '장신구' | '소모품' | '외형' | '기타' | '인게임재화';

// 아이템 등급 enum
export enum ItemGrade {
  NORMAL = 'NORMAL',
  RARE = 'RARE',
  LEGACY = 'LEGACY',
  UNIQUE = 'UNIQUE',
  HEROIC = 'HEROIC',
}

// 등급 라벨 매핑
export const GRADE_LABELS: Record<ItemGrade, string> = {
  [ItemGrade.NORMAL]: '일반',
  [ItemGrade.RARE]: '희귀',
  [ItemGrade.LEGACY]: '전승',
  [ItemGrade.UNIQUE]: '유일',
  [ItemGrade.HEROIC]: '영웅',
};

// 등급 색상 매핑
export const GRADE_COLORS: Record<ItemGrade, string> = {
  [ItemGrade.NORMAL]: '#C3C3C3',
  [ItemGrade.RARE]: '#19E048',
  [ItemGrade.LEGACY]: '#379AFF',
  [ItemGrade.UNIQUE]: '#FFD02B',
  [ItemGrade.HEROIC]: '#FF6C00',
};

// 상점 아이템 타입
export interface ShopItem {
  id: string;
  name: string;
  type: ItemType;
  grade?: ItemGrade;
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
    localKey: 'aion2-shop-items',
  });

  // ID로 아이템 정보 가져오기
  const getItemById = useCallback((id: string): ShopItem | undefined => shopItems?.find(item => item.id === id), [shopItems]);

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
