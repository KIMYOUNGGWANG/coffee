"use client";

import React from "react";

interface RadarChartProps {
  acidity: number;
  sweetness: number;
  body: number;
  size?: number;
}

export default function RadarChart({ acidity, sweetness, body, size = 180 }: RadarChartProps) {
  const center = size / 2;
  const maxVal = 5;
  const rScale = (size * 0.35) / maxVal; // scale radius

  // Angles for the 3 axes (120 degrees apart)
  // Axis 0: Acidity (pointing top: -90 degrees or 270 rad)
  // Axis 1: Sweetness (pointing bottom-right: 30 degrees or 0.52 rad)
  // Axis 2: Body (pointing bottom-left: 150 degrees or 2.62 rad)
  const angles = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6];

  // Labels for the axes
  const labels = ["산미 (Acidity)", "단맛 (Sweetness)", "바디감 (Body)"];

  // Helper to calculate coordinates
  const getCoords = (val: number, angle: number) => {
    const r = val * rScale;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Coordinates for the data points
  const points = [
    getCoords(acidity || 1, angles[0]),
    getCoords(sweetness || 1, angles[1]),
    getCoords(body || 1, angles[2]),
  ];

  // Polygon path string
  const polyPointsString = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Grid lines: Draw concentric triangles representing levels 1 to 5
  const gridLevels = [1, 2, 3, 4, 5];

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <svg width={size} height={size} className="overflow-visible">
        {/* Grids / Triangles */}
        {gridLevels.map((level) => {
          const gridPoints = angles.map((angle) => getCoords(level, angle));
          const gridPointsStr = gridPoints.map((p) => `${p.x},${p.y}`).join(" ");
          return (
            <polygon
              key={level}
              points={gridPointsStr}
              fill="none"
              stroke="#e4e2db"
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
              stroke="#d0cebf"
              strokeWidth="1"
            />
          );
        })}

        {/* Data Polygon */}
        <polygon
          points={polyPointsString}
          fill="rgba(197, 137, 72, 0.28)" // Caramel transparent fill
          stroke="hsl(28, 45%, 35%)" // Caramel stroke
          strokeWidth="2"
          className="transition-all duration-500 ease-out"
        />

        {/* Data points dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="hsl(28, 45%, 35%)"
            stroke="#ffffff"
            strokeWidth="1.5"
            className="shadow-sm transition-all duration-500 ease-out"
          />
        ))}

        {/* Labels text */}
        {angles.map((angle, i) => {
          // Push labels slightly outwards from level 5 coordinates
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
              className="text-[10px] font-extrabold fill-espresso/60 tracking-wider font-sans"
            >
              {labels[i]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
