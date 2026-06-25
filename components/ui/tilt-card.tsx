"use client";

import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glowColor?: string;
}

export function TiltCard({ children, className, onClick, glowColor = "rgba(212, 175, 55, 0.15)" }: TiltCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Rotate spring mapping
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), { damping: 25, stiffness: 220 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), { damping: 25, stiffness: 220 });
  
  // Custom cursor position calculation
  const highlightX = useSpring(useTransform(x, [-0.5, 0.5], [0, 100]), { damping: 25, stiffness: 220 });
  const highlightY = useSpring(useTransform(y, [-0.5, 0.5], [0, 100]), { damping: 25, stiffness: 220 });

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const relativeX = (e.clientX - rect.left) / rect.width - 0.5;
    const relativeY = (e.clientY - rect.top) / rect.height - 0.5;

    x.set(relativeX);
    y.set(relativeY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const glowBackground = useTransform(
    [highlightX, highlightY],
    ([hx, hy]) => `radial-gradient(circle 250px at ${hx}% ${hy}%, ${glowColor} 0%, transparent 100%)`
  );

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX: isMobile ? 0 : rotateX,
        rotateY: isMobile ? 0 : rotateY,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      className={cn("relative group w-full h-full", className)}
    >
      {/* Light glow overlay tracking cursor */}
      {!isMobile && (
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 rounded-[inherit]"
          style={{ background: glowBackground }}
        />
      )}
      <div style={{ transform: "translateZ(20px)", transformStyle: "preserve-3d" }} className="h-full w-full">
        {children}
      </div>
    </motion.div>
  );
}
