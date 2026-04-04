import { useEffect, useRef, useState } from "react";

/**
 * Sets visible=true once the element intersects the viewport (Apple-style section reveals).
 */
export function useScrollReveal(options = {}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  const { threshold = 0.12, rootMargin = "0px 0px -6% 0px", once = true } = options;

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        if (once) io.disconnect();
      },
      { threshold, rootMargin },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, visible };
}
