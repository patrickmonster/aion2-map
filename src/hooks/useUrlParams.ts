import { useCallback } from "react";

// URL 파라미터 관리 훅
export const useUrlParams = () => {
  const getUrlParam = useCallback((key: string): string | null => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(key);
  }, []);

  const setUrlParam = useCallback((key: string, value: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.replaceState({}, "", url.toString());
  }, []);

  return { getUrlParam, setUrlParam };
};
