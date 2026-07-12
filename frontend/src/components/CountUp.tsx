import React, { useState, useEffect, useRef } from 'react';

export const CountUp = ({ 
  value, 
  duration = 500, 
  decimals = 0,
  prefix = "",
  suffix = ""
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef(null);
  const startValue = useRef(displayValue);

  useEffect(() => {
    // If it's the first render, just snap to the value to avoid animating from 0 on load
    if (startValue.current === 0 && value !== 0 && displayValue === 0) {
        setDisplayValue(value);
        startValue.current = value;
        return;
    }

    if (value === displayValue) return;

    startValue.current = displayValue;
    startTime.current = performance.now();
    let animationFrame;

    const animate = (time) => {
      const elapsed = time - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      
      // ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      const current = startValue.current + (value - startValue.current) * easeOut;
      setDisplayValue(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {Number(displayValue).toFixed(decimals)}
      {suffix}
    </span>
  );
};
