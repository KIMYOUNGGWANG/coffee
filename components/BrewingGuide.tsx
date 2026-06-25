"use client";

import { useState } from "react";
import { Edit2, Check, Sparkles, Droplets, Thermometer, Timer, Scale } from "lucide-react";
import type { TastingCardData } from "@/hooks/useTastingCards";

type BrewingGuideProps = {
  card: TastingCardData;
};

export default function BrewingGuide({ card }: BrewingGuideProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [recipe, setRecipe] = useState({
    temp: "92°C",
    grind: "Medium",
    ratio: "1:15",
    time: "2m 30s",
  });

  const handleSave = () => {
    setIsEditing(false);
    // TODO: Call API to save to brewing_logs table
  };

  const isLightRoast = card.tags.includes("Light") || card.tags.includes("라이트로스트");
  // Simple heuristic for AI baseline
  const aiTemp = isLightRoast ? "94°C" : "90°C";
  const aiGrind = isLightRoast ? "Medium-Fine" : "Medium-Coarse";

  return (
    <div className="bg-white/5 rounded-xl p-3 border border-white/10 transition-all">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          {isEditing ? (
            <>My Custom Recipe</>
          ) : (
            <><Sparkles size={10} className="text-primary-amber" /> AI Baseline Recipe</>
          )}
        </h4>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="text-xs flex items-center gap-1 text-primary-amber hover:text-white transition-colors"
        >
          {isEditing ? <><Check size={12} /> Save</> : <><Edit2 size={12} /> Edit</>}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
        <div className="flex items-center gap-2">
          <Thermometer size={14} className="text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-[9px] text-muted-foreground">Temp</span>
            {isEditing ? (
              <input 
                type="text" 
                value={recipe.temp} 
                onChange={(e) => setRecipe({...recipe, temp: e.target.value})}
                className="bg-black/40 border border-white/20 rounded px-1.5 py-0.5 text-xs w-full focus:outline-none focus:border-primary-amber"
              />
            ) : (
              <span className="font-bold">{aiTemp}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Droplets size={14} className="text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-[9px] text-muted-foreground">Grind</span>
            {isEditing ? (
              <input 
                type="text" 
                value={recipe.grind} 
                onChange={(e) => setRecipe({...recipe, grind: e.target.value})}
                className="bg-black/40 border border-white/20 rounded px-1.5 py-0.5 text-xs w-full focus:outline-none focus:border-primary-amber"
              />
            ) : (
              <span className="font-bold">{aiGrind}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Scale size={14} className="text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-[9px] text-muted-foreground">Ratio</span>
            {isEditing ? (
              <input 
                type="text" 
                value={recipe.ratio} 
                onChange={(e) => setRecipe({...recipe, ratio: e.target.value})}
                className="bg-black/40 border border-white/20 rounded px-1.5 py-0.5 text-xs w-full focus:outline-none focus:border-primary-amber"
              />
            ) : (
              <span className="font-bold">{recipe.ratio}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Timer size={14} className="text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-[9px] text-muted-foreground">Time</span>
            {isEditing ? (
              <input 
                type="text" 
                value={recipe.time} 
                onChange={(e) => setRecipe({...recipe, time: e.target.value})}
                className="bg-black/40 border border-white/20 rounded px-1.5 py-0.5 text-xs w-full focus:outline-none focus:border-primary-amber"
              />
            ) : (
              <span className="font-bold">{recipe.time}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
