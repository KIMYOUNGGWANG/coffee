"use client";

import React from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip
} from "recharts";

interface FlavorRadarChartProps {
  metric1: number; // Acidity
  metric2: number; // Sweetness
  metric3: number; // Body
  metric4: number; // Bitterness
  metric5: number; // Aroma
  metric6: number; // Aftertaste
  className?: string;
}

export function FlavorRadarChart({
  metric1,
  metric2,
  metric3,
  metric4,
  metric5,
  metric6,
  className = "",
}: FlavorRadarChartProps) {
  const data = [
    { subject: "산미", value: metric1 },
    { subject: "단맛", value: metric2 },
    { subject: "바디", value: metric3 },
    { subject: "쓴맛", value: metric4 },
    { subject: "향", value: metric5 },
    { subject: "여운", value: metric6 },
  ];

  return (
    <div className={`w-full h-full min-h-[200px] ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="rgba(255,255,255,0.2)" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: "#A3A3A3", fontSize: 11, fontWeight: "bold" }} 
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 5]} 
            tick={false} 
            axisLine={false} 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: "rgba(10,10,10,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
            itemStyle={{ color: "#D4AF37", fontWeight: "bold" }}
          />
          <Radar
            name="점수"
            dataKey="value"
            stroke="#D4AF37"
            fill="#D4AF37"
            fillOpacity={0.4}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
