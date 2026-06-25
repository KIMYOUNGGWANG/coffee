"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

type TasteRadarChartProps = {
  acidity: number;
  sweetness: number;
  body: number;
  maxScore?: number;
  size?: number;
};

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

export function TasteRadarChart({
  acidity,
  sweetness,
  body,
  maxScore = 5,
  size = 200,
}: TasteRadarChartProps) {
  const center = size / 2;
  const maxRadius = center - 30; // Leave room for labels
  const data = [
    { label: "산미 (Acidity)", value: acidity },
    { label: "단맛 (Sweetness)", value: sweetness },
    { label: "바디 (Body)", value: body },
  ];

  const chartData = useMemo(() => {
    return data.map((d, index) => {
      const angle = (index * 360) / data.length;
      const radius = Math.max((d.value / maxScore) * maxRadius, 0);
      const point = polarToCartesian(center, center, radius, angle);
      const labelPoint = polarToCartesian(center, center, maxRadius + 15, angle);
      return { ...d, angle, point, labelPoint };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acidity, sweetness, body, maxScore, maxRadius, center]);

  const polygonPath = chartData.map((d) => `${d.point.x},${d.point.y}`).join(" ");

  // Grid levels (3 concentric triangles)
  const gridLevels = [0.33, 0.66, 1].map((level) => {
    const points = data.map((_, index) => {
      const angle = (index * 360) / data.length;
      const p = polarToCartesian(center, center, maxRadius * level, angle);
      return `${p.x},${p.y}`;
    });
    return points.join(" ");
  });

  return (
    <div className="relative flex items-center justify-center p-4 w-full h-full">
      <svg width={size} height={size} className="overflow-visible" viewBox={`0 0 ${size} ${size}`}>
        {/* Glow Defs */}
        <defs>
          <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Grids */}
        {gridLevels.map((points, index) => (
          <polygon
            key={`grid-${index}`}
            points={points}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="1"
          />
        ))}

        {/* Axes */}
        {data.map((_, index) => {
          const angle = (index * 360) / data.length;
          const endPoint = polarToCartesian(center, center, maxRadius, angle);
          return (
            <line
              key={`axis-${index}`}
              x1={center}
              y1={center}
              x2={endPoint.x}
              y2={endPoint.y}
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          );
        })}

        {/* Data Polygon with Framer Motion */}
        <motion.polygon
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          points={polygonPath}
          fill="rgba(212, 175, 55, 0.2)"
          stroke="#D4AF37"
          strokeWidth="2"
          filter="url(#gold-glow)"
          style={{ transformOrigin: `${center}px ${center}px` }}
        />

        {/* Data Points */}
        {chartData.map((d, index) => (
          <motion.circle
            key={`point-${index}`}
            initial={{ r: 0 }}
            animate={{ r: 4 }}
            transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
            cx={d.point.x}
            cy={d.point.y}
            fill="#FFF"
            stroke="#D4AF37"
            strokeWidth="2"
          />
        ))}

        {/* Labels */}
        {chartData.map((d, index) => (
          <text
            key={`label-${index}`}
            x={d.labelPoint.x}
            y={d.labelPoint.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.8)"
            className="text-[11px] font-bold tracking-widest"
          >
            {d.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
