"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";

interface FluidRadarChartProps {
  acidity: number;
  sweetness: number;
  body: number;
  size?: number;
  hideLabels?: boolean;
}

export default function FluidRadarChart({ acidity, sweetness, body, size = 180, hideLabels = false }: FluidRadarChartProps) {
  const center = size / 2;
  const maxVal = 5;
  const rScale = (size * 0.35) / maxVal;

  const angles = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6];
  const labels = ["산미 (Acidity)", "단맛 (Sweetness)", "바디감 (Body)"];

  const getCoords = (val: number, angle: number) => {
    const r = val * rScale;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Base points
  const points = [
    getCoords(acidity || 1, angles[0]),
    getCoords(sweetness || 1, angles[1]),
    getCoords(body || 1, angles[2]),
  ];

  const polyPointsString = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Create a subtle breathing effect by slightly altering values
  const [breathePhase, setBreathePhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBreathePhase((prev) => (prev === 0 ? 1 : 0));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const breathedPoints = [
    getCoords((acidity || 1) + (breathePhase ? 0.1 : -0.1), angles[0]),
    getCoords((sweetness || 1) + (breathePhase ? 0.1 : -0.1), angles[1]),
    getCoords((body || 1) + (breathePhase ? 0.1 : -0.1), angles[2]),
  ];
  
  const breathedPolyString = breathedPoints.map((p) => `${p.x},${p.y}`).join(" ");

  const gridLevels = [1, 2, 3, 4, 5];

  return (
    <div className="flex flex-col items-center justify-center select-none relative group">
      <svg width={size} height={size} className="overflow-visible">
        {/* Grids */}
        {gridLevels.map((level) => {
          const gridPoints = angles.map((angle) => getCoords(level, angle));
          const gridPointsStr = gridPoints.map((p) => `${p.x},${p.y}`).join(" ");
          return (
            <polygon
              key={level}
              points={gridPointsStr}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={level === 5 ? "1.5" : "0.75"}
              strokeDasharray={level === 5 ? "none" : "2,2"}
            />
          );
        })}

        {/* Axis lines */}
        {angles.map((angle, i) => {
          const outerCoords = getCoords(maxVal, angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={outerCoords.x}
              y2={outerCoords.y}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
            />
          );
        })}

        {/* Fluid Data Polygon */}
        <motion.polygon
          animate={{ points: breathedPolyString }}
          transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
          fill="rgba(217, 160, 91, 0.28)" // primary-amber transparent fill
          stroke="#D9A05B" // primary-amber stroke
          strokeWidth="2"
        />

        {/* Data points dots */}
        {breathedPoints.map((p, i) => (
          <motion.circle
            key={i}
            animate={{ cx: p.x, cy: p.y }}
            transition={{ duration: 2, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
            r="4"
            fill="#D9A05B"
            stroke="#0D0A07"
            strokeWidth="1.5"
            className="shadow-sm"
          />
        ))}

        {/* Labels text */}
        {!hideLabels && angles.map((angle, i) => {
          const labelCoords = getCoords(maxVal + 0.9, angle);
          let textAnchor: "middle" | "start" | "end" = "middle";
          let dy = "0.35em";

          if (i === 1) {
            textAnchor = "start";
            dy = "0.7em";
          } else if (i === 2) {
            textAnchor = "end";
            dy = "0.7em";
          } else {
            dy = "-0.6em";
          }

          return (
            <text
              key={i}
              x={labelCoords.x}
              y={labelCoords.y}
              textAnchor={textAnchor}
              dy={dy}
              className="text-[10px] font-extrabold fill-muted-foreground tracking-wider font-sans transition-opacity duration-300 group-hover:fill-foreground"
            >
              {labels[i]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
