import { Sparkles, Layers, Heart, Share2 } from "lucide-react";

export function LandingFeatures() {
  const features = [
    {
      icon: <Sparkles size={20} />,
      title: "20초 빠른 기록",
      desc: "원두 이름, 로스터리, 다시 살지, 한 줄 메모만 먼저 남깁니다."
    },
    {
      icon: <Layers size={20} />,
      title: "사진은 선택",
      desc: "봉투 스캔은 보조 도구입니다. 사진 원본은 기록에 저장하지 않습니다."
    },
    {
      icon: <Heart size={20} />,
      title: "다시 살 단서",
      desc: "좋았던 이유와 구매 힌트를 나중에 바로 찾을 수 있게 묶습니다."
    },
    {
      icon: <Share2 size={20} />,
      title: "필요할 때 확장",
      desc: "Premium, PDF, 공유 이미지는 첫 기록 후 선택하는 부가 기능입니다."
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {features.map((feature, idx) => (
        <article
          key={idx}
          className="group flex h-full flex-col items-start gap-5 rounded-3xl border border-white/5 bg-[#0A0A0A]/80 p-8 shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-colors duration-300 hover:border-[#D4AF37]/40 hover:bg-[#111111]/90"
        >
          <div className="flex size-12 items-center justify-center rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 text-[#D4AF37] shadow-inner transition-transform duration-300 group-hover:-translate-y-0.5">
            {feature.icon}
          </div>
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-lg text-[#F5F5F5]">{feature.title}</h3>
            <p className="text-xs text-[#F5F5F5]/60 leading-relaxed font-light">
              {feature.desc}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
