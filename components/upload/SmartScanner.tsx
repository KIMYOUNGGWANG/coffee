"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, Loader2, X, AlertCircle, ScanLine, Star, Heart, SwitchCamera, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ScanResult } from "@/app/api/v1/scan/route";
import PaywallModal from "@/components/PaywallModal";

type SmartScannerProps = {
  readonly onScanComplete: (result: ScanResult) => void;
  readonly onClose: () => void;
  readonly onQuickSave: (result: ScanResult, rating: number, wantAgain: boolean) => void;
};

type ScanPhase = "idle" | "uploading" | "scanning" | "done" | "error";

export function SmartScanner({ onScanComplete, onClose, onQuickSave }: SmartScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [phase, setPhase] = useState<ScanPhase>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [rating, setRating] = useState<number>(5);
  const [wantAgain, setWantAgain] = useState<boolean>(true);
  
  // Camera state
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const resetState = useCallback(() => {
    setPhase("idle");
    setPreviewUrl(null);
    setErrorMessage("");
    setScanResult(null);
    setRating(5);
    setWantAgain(true);
    setCameraError(false);
    setIsCameraReady(false);
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async (mode: "environment" | "user") => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(console.error);
          setIsCameraReady(true);
        };
      }
      streamRef.current = stream;
      setCameraError(false);
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(true);
      setIsCameraReady(false);
    }
  }, [stopCamera]);

  useEffect(() => {
    if (phase === "idle") {
      startCamera(facingMode);
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [phase, facingMode, startCamera, stopCamera]);

  const callScanApi = async (base64: string, mimeType: string) => {
    try {
      const response = await fetch("/api/v1/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mimeType }),
      });
      const json = await response.json();
      if (response.status === 402) {
        setIsPaywallOpen(true);
        setPhase("error");
        setErrorMessage(json?.error?.message ?? "결제가 필요합니다.");
        return;
      }
      if (!response.ok) {
        throw new Error(json?.error?.message ?? "스캔 요청이 실패했습니다.");
      }
      setScanResult(json.data as ScanResult);
      setPhase("done");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.");
      setPhase("error");
    }
  };

  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to base64
    const base64Data = canvas.toDataURL("image/jpeg", 0.9);
    setPreviewUrl(base64Data);
    setPhase("scanning");
    
    const base64 = base64Data.split(",")[1];
    callScanApi(base64, "image/jpeg");
  };

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
      if (!validTypes.includes(file.type)) {
        setErrorMessage("JPG, PNG, WebP, HEIC 이미지만 지원합니다.");
        setPhase("error");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage("이미지 크기는 10MB 이하여야 합니다.");
        setPhase("error");
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setPhase("scanning");

      try {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = "";
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        callScanApi(base64, file.type);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "파일 읽기 실패");
        setPhase("error");
      }
    },
    [],
  );

  const toggleCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  const handleConfirm = useCallback(() => {
    if (scanResult) {
      onScanComplete(scanResult);
    }
  }, [scanResult, onScanComplete]);

  return (
    <>
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-0 sm:p-4"
        onClick={(event) => {
          if (event.target === event.currentTarget && phase !== "scanning") {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md bg-black sm:rounded-3xl border-0 sm:border border-white/10 shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-4 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] backdrop-blur-md">
                <ScanLine size={16} />
              </div>
              <div className="drop-shadow-md">
                <h3 className="text-sm font-bold text-white">AI 스마트 렌즈</h3>
                <p className="text-[10px] text-white/70">원두 패키지를 촬영하세요</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={phase === "scanning"}
              className="flex size-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white transition-colors hover:bg-white/20 disabled:opacity-30 border border-white/10 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 relative flex flex-col items-center justify-center min-h-[400px]">
            {/* Idle / Camera view */}
            {phase === "idle" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900">
                {cameraError ? (
                  <div className="text-center p-6 flex flex-col items-center z-10">
                    <AlertCircle size={40} className="text-white/30 mb-4" />
                    <p className="text-white/60 mb-6 text-sm">카메라 권한을 허용해주세요.<br/>또는 앨범에서 사진을 업로드하세요.</p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-[#D4AF37] text-black font-bold rounded-xl flex items-center gap-2"
                    >
                      <ImagePlus size={18} /> 사진 업로드
                    </button>
                  </div>
                ) : (
                  <>
                    <video 
                      ref={videoRef} 
                      playsInline 
                      muted 
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    
                    {/* Viewfinder overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center px-8">
                      <div className="w-full aspect-[3/4] max-w-[300px] border-2 border-white/30 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                        {/* Corner markers */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#D4AF37] rounded-tl-xl -mt-0.5 -ml-0.5" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#D4AF37] rounded-tr-xl -mt-0.5 -mr-0.5" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#D4AF37] rounded-bl-xl -mb-0.5 -ml-0.5" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#D4AF37] rounded-br-xl -mb-0.5 -mr-0.5" />
                      </div>
                    </div>
                    
                    {/* Camera Controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 flex items-center justify-center gap-8 bg-gradient-to-t from-black/80 to-transparent">
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="size-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 active:scale-95 transition-transform"
                      >
                        <ImagePlus size={20} />
                      </button>
                      
                      <button 
                        onClick={takePhoto}
                        disabled={!isCameraReady}
                        className="size-20 rounded-full border-4 border-white/30 flex items-center justify-center active:scale-95 transition-all disabled:opacity-50"
                      >
                        <div className="size-16 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
                      </button>
                      
                      <button 
                        onClick={toggleCamera}
                        className="size-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 active:scale-95 transition-transform"
                      >
                        <SwitchCamera size={20} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Uploading / Scanning states */}
            {(phase === "uploading" || phase === "scanning") && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black px-6">
                {previewUrl && (
                  <div className="relative w-full max-w-[300px] aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="업로드한 원두 패키지"
                      className="w-full h-full object-cover"
                    />
                    {/* Scan line animation overlay */}
                    <motion.div
                      className="absolute inset-x-0 h-1 bg-[#D4AF37] shadow-[0_0_20px_rgba(212,175,55,1)]"
                      animate={{ top: ["0%", "100%", "0%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="absolute inset-0 bg-[#D4AF37]/10 mix-blend-overlay" />
                  </div>
                )}
                <div className="mt-8 flex flex-col items-center gap-3 text-[#D4AF37]">
                  <Loader2 size={24} className="animate-spin" />
                  <span className="text-sm font-bold tracking-wide">
                    {phase === "uploading" ? "이미지 분석 중..." : "AI가 라벨을 스캔하고 있습니다..."}
                  </span>
                </div>
              </div>
            )}

            {/* Done — show results */}
            {phase === "done" && scanResult && (
              <div className="absolute inset-0 overflow-y-auto bg-zinc-950 p-6 flex flex-col pt-20">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center shadow-xl">
                  <div className="mx-auto w-12 h-12 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mb-3">
                    <ScanLine size={24} />
                  </div>
                  <h4 className="text-xl font-bold text-white leading-tight font-serif">
                    {scanResult.beanName || "이름 없는 원두"}
                  </h4>
                  <p className="text-sm text-[#D4AF37] mt-1 font-medium">
                    {scanResult.roasterName || "로스터리 정보 없음"}
                  </p>
                </div>

                <div className="mt-6 flex flex-col gap-4">
                  {/* Rating UI */}
                  <div className="flex flex-col items-center justify-center py-4 bg-white/[0.03] rounded-2xl border border-white/5">
                    <span className="text-xs text-white/50 mb-2 font-bold uppercase tracking-widest">원두 평점</span>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 cursor-pointer transition-transform active:scale-95 bg-transparent border-none"
                        >
                          <Star
                            size={32}
                            className={cn(
                              "transition-colors",
                              star <= rating ? "fill-[#D4AF37] text-[#D4AF37]" : "text-white/10"
                            )}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Want Again Toggle */}
                  <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white">또 마시고 싶다</span>
                      <span className="text-xs text-white/40 mt-0.5">다시 사고 싶은 원두로 표시</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setWantAgain(!wantAgain)}
                      className="flex size-12 items-center justify-center rounded-full bg-white/5 transition-all hover:bg-white/10 active:scale-95 cursor-pointer border-none"
                    >
                      <Heart
                        size={24}
                        className={cn(
                          "transition-colors",
                          wantAgain ? "fill-[#FF6B6B] text-[#FF6B6B]" : "text-white/20"
                        )}
                      />
                    </button>
                  </div>
                </div>

                <div className="mt-auto space-y-3 pt-6 pb-6 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => onQuickSave(scanResult, rating, wantAgain)}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#D4AF37] py-4 text-sm font-bold text-black transition-opacity hover:opacity-90 cursor-pointer border-none shadow-[0_8px_20px_rgba(212,175,55,0.3)] active:translate-y-1"
                  >
                    선반에 저장하기
                  </button>
                  
                  <div className="flex justify-between items-center px-2">
                    <button
                      type="button"
                      onClick={resetState}
                      className="text-sm text-white/40 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                    >
                      다시 촬영하기
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirm}
                      className="text-sm text-[#D4AF37] hover:text-white transition-all bg-transparent border-none cursor-pointer font-bold"
                    >
                      상세 정보 확인 →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Error state */}
            {phase === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 px-6 text-center z-10">
                <div className="flex size-16 items-center justify-center rounded-full bg-red-500/10 text-red-400 mb-6">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">스캔 실패</h3>
                <p className="text-sm text-white/50 mb-8 max-w-[250px] leading-relaxed">{errorMessage}</p>
                <button
                  type="button"
                  onClick={resetState}
                  className="rounded-2xl border border-white/10 bg-white/5 px-8 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10 cursor-pointer active:scale-95"
                >
                  다시 시도하기
                </button>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </motion.div>
      </motion.div>
      </AnimatePresence>
      
      <PaywallModal isOpen={isPaywallOpen} onClose={() => {
        setIsPaywallOpen(false);
        onClose();
      }} />
    </>
  );
}
