import React from "react";
import { useScrollReveal } from "../../hooks/useScrollReveal";

/**
 * Wraps content for scroll-triggered fade + slide-up (cubic ease like Apple marketing pages).
 */
const ScrollSection = ({
  children,
  className = "",
  delayMs = 0,
  as: Component = "div",
}) => {
  const { ref, visible } = useScrollReveal();

  return (
    <Component
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={`scroll-reveal-block ${visible ? "scroll-reveal-block--visible" : ""} ${className}`}
    >
      {children}
    </Component>
  );
};

export default ScrollSection;
