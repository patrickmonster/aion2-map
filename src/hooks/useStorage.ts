import { useCallback, useState } from "react";

export const useStorage = <T>({
  url,
  localKey,
}: {
  url: string;
  localKey: string;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T>();

  // 서버에서 데이터 로드
  const loadServerData = useCallback(async (): Promise<T> => {
    setIsLoading(true);
    setError(null);

    try {
      const basePath = process.env.PUBLIC_URL || "";
      const response = await fetch(`${basePath}/${url}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: {
        items: T;
        category: string;
        description: string;
      } = await response.json();
      const items = data.items;
      setData(items);
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
  const loadLocalData = useCallback((): T => {
    try {
      const savedData = localStorage.getItem(localKey);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        return parsedData;
      }
    } catch (err) {
      console.error("로컬 데이터 로드 실패:", err);
    }
    return {} as T;
  }, []);

  // localStorage에 데이터 저장
  const saveLocalData = useCallback((items: T) => {
    try {
      localStorage.setItem(localKey, JSON.stringify(items));
    } catch (err) {
      console.error("로컬 데이터 저장 실패:", err);
    }
  }, []);

  // 초기 데이터 로드
  const initializeData = useCallback(async () => {
    if (data) return;

    try {
      // 먼저 로컬 데이터 확인
      const localData = loadLocalData();
      if (localData && Object.keys(localData).length > 0) {
        setData(localData);
        return;
      }

      // 서버에서 최신 데이터 로드
      await loadServerData();
    } catch (err) {
      console.error("데이터 초기화 실패:", err);
    }
  }, [loadLocalData, loadServerData]);

  return {
    data,
    isLoading,
    error,
    initializeData,
    loadServerData,
    loadLocalData,
    saveLocalData,
  };
};
