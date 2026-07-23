import { useEffect } from 'react';

export const useResizeObserver = (element: HTMLElement | null, onResize: () => void): void => {
  useEffect(() => {
    if (!element) {
      return;
    }

    const observer = new ResizeObserver(() => onResize());
    observer.observe(element);

    return () => observer.disconnect();
  }, [element, onResize]);
};
