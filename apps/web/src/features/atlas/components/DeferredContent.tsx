import { useEffect, useRef, useState, type ReactNode } from 'react';

export const DeferredContent = ({ children, label }: { children: ReactNode; label: string }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || shouldRender) {
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setShouldRender(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: '500px 0px' },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [shouldRender]);

  return (
    <div ref={containerRef} className="atlas-deferred-content">
      {shouldRender ? children : <p className="atlas-deferred-placeholder">{label} loads as you approach.</p>}
    </div>
  );
};