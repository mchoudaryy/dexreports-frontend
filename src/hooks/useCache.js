// hooks/useCache.js
import { useRef } from "react";

export const useCache = (duration = 60000) => {
  const cache = useRef(new Map());

  const get = (key) => {
    const cached = cache.current.get(key);
    if (cached && Date.now() - cached.timestamp < duration) {
      return cached.data;
    }
    return null;
  };

  const set = (key, data) => {
    cache.current.set(key, {
      data,
      timestamp: Date.now(),
    });
  };

  const clear = (key) => {
    if (key) {
      cache.current.delete(key);
    } else {
      cache.current.clear();
    }
  };

  return { get, set, clear };
};
