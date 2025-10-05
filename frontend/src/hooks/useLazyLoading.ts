import { useState, useEffect, useCallback, useRef } from 'react';

interface UseLazyLoadingOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

interface UseLazyLoadingReturn {
  isIntersecting: boolean;
  ref: (node: Element | null) => void;
}

export const useLazyLoading = ({
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true,
}: UseLazyLoadingOptions = {}): UseLazyLoadingReturn => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const elementRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback((node: Element | null) => {
    elementRef.current = node;
  }, []);

  useEffect(() => {
    if (!elementRef.current) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        
        if (triggerOnce && entry.isIntersecting) {
          observerRef.current?.disconnect();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current.observe(elementRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { isIntersecting, ref };
};

// Хук для пагинации с lazy loading
interface UsePaginationOptions<T> {
  items: T[];
  itemsPerPage?: number;
  initialPage?: number;
  lazyLoad?: boolean;
}

interface UsePaginationReturn<T> {
  currentPage: number;
  totalPages: number;
  currentItems: T[];
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  loadMore: () => void;
}

export const usePagination = <T>({
  items,
  itemsPerPage = 10,
  initialPage = 1,
  lazyLoad = false,
}: UsePaginationOptions<T>): UsePaginationReturn<T> => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [loadedPages, setLoadedPages] = useState(new Set([initialPage]));

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const currentItems = lazyLoad
    ? items.slice(0, Math.max(...Array.from(loadedPages)) * itemsPerPage)
    : items.slice(startIndex, endIndex);

  const hasNextPage = currentPage < totalPages;
  const hasPreviousPage = currentPage > 1;

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      if (lazyLoad) {
        setLoadedPages(prev => new Set([...prev, page]));
      }
    }
  }, [totalPages, lazyLoad]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      goToPage(currentPage + 1);
    }
  }, [hasNextPage, currentPage, goToPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      goToPage(currentPage - 1);
    }
  }, [hasPreviousPage, currentPage, goToPage]);

  const loadMore = useCallback(() => {
    if (lazyLoad && hasNextPage) {
      setLoadedPages(prev => new Set([...prev, currentPage + 1]));
    }
  }, [lazyLoad, hasNextPage, currentPage]);

  return {
    currentPage,
    totalPages,
    currentItems,
    hasNextPage,
    hasPreviousPage,
    goToPage,
    nextPage,
    previousPage,
    loadMore,
  };
};

// Хук для debounced поиска
export const useDebouncedSearch = <T>(
  searchFn: (query: string) => Promise<T[]>,
  delay: number = 300
) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (query.trim()) {
      setLoading(true);
      setError(null);

      timeoutRef.current = setTimeout(async () => {
        try {
          const searchResults = await searchFn(query);
          setResults(searchResults);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Ошибка поиска');
          setResults([]);
        } finally {
          setLoading(false);
        }
      }, delay);
    } else {
      setResults([]);
      setLoading(false);
      setError(null);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, delay]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
  };
};
