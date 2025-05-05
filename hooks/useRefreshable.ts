import { useState, useCallback } from 'react';

export function useRefreshable(onRefreshFunction: () => void) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    onRefreshFunction();
    // The actual refreshing state will be set to false in the onRefreshFunction
  }, [onRefreshFunction]);

  return {
    refreshing,
    onRefresh,
    setRefreshing
  };
}