import { useCallback, useState } from 'react';

// 조합법 레시피 타입
export interface Recipe {
  id: string;
  level: number;
  cnt: number;
  combo: number;
  increase: boolean;
  updatedAt: string;
  materials: string;
  ingredient: {
    itemId: string;
    quantity: number;
  }[];
}

// JSON 파일 구조
interface RecipeJsonData {
  category: string;
  description: string;
  items: Recipe[];
}

export const useRecipeData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 조합법 데이터 로드
  const loadRecipeData = useCallback(async (recipeFile: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const basePath = process.env.PUBLIC_URL || '';
      const recipeResponse = await fetch(`${basePath}/Combination/${recipeFile}`);

      if (!recipeResponse.ok) {
        throw new Error(`HTTP error! status: ${recipeResponse.status}`);
      }

      const recipeJson: RecipeJsonData = await recipeResponse.json();

      return {
        items: recipeJson.items || [],
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '조합법 데이터 로드 실패';
      setError(errorMessage);
      console.error('조합법 데이터 로드 실패:', err);
      // 에러 발생시 빈 배열 반환
      return {
        items: [],
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 탭에 따른 파일명 반환
  const getRecipeFileName = useCallback((tab: string): string => {
    switch (tab) {
      case '연금':
        return 'alchemy.json';
      case '갑옷':
        return 'armor.json';
      case '대장':
        return 'blacksmith.json';
      case '세공':
        return 'handicrafting.json';
      case '요리':
        return 'food.json';
      default:
        return 'alchemy.json';
    }
  }, []);

  return {
    loadRecipeData,
    getRecipeFileName,
    isLoading,
    error,
  };
};
