import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Camera, NotebookPen, PenLine, RotateCcw } from 'lucide-react-native';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const guideWidth = Math.min(width - 80, 290);
  const guideHeight = Math.min(430, Math.max(320, guideWidth * 1.45));

  const openCamera = async () => {
    setCaptureError(null);

    if (permission?.granted) {
      setShowCamera(true);
      return;
    }

    const result = await requestPermission();

    if (result.granted) {
      setShowCamera(true);
      return;
    }

    setCaptureError('카메라 권한이 꺼져 있어요. 직접 노트를 쓰거나 설정에서 권한을 열어주세요.');
  };

  const takePicture = async () => {
    if (!cameraRef.current || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setCaptureError(null);

    try {
      await cameraRef.current.takePictureAsync({ base64: false });
      const labelReadingDelayMs = 900;
      await new Promise(resolve => setTimeout(resolve, labelReadingDelayMs));
      router.push('/note/create');
    } catch {
      setCaptureError('사진을 남기지 못했습니다. 빛을 조금 더 밝게 두고 다시 시도해 주세요.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!showCamera) {
    return (
      <ScrollView className="flex-1 bg-background" contentContainerClassName="px-5 pb-36 pt-14">
        <View className="mb-6 flex-row items-center justify-between">
          <View className="h-10 w-10 items-center justify-center rounded-full border border-[#2A1A12]/20 bg-room-paper">
            <Text className="text-base font-black text-room-espresso">노</Text>
          </View>
          <View className="rounded-full border border-[#2A1A12]/10 bg-room-paper px-3 py-2">
            <Text className="text-xs font-black text-room-cocoa">새 노트</Text>
          </View>
        </View>

        <View className="mb-5">
          <Text className="break-keep text-[26px] font-bold leading-8 text-room-espresso">
            짧게 남기기
          </Text>
          <Text className="mt-2 break-keep text-sm font-semibold leading-6 text-room-cocoa">
            원두 이름을 몰라도 됩니다. 다시 고를 때 떠올릴 말만 적어두세요.
          </Text>
        </View>

        <View className="mb-4 rounded-[1.5rem] border border-[#2A1A12]/10 bg-room-paper p-4">
          <View className="mb-3 flex-row items-center gap-2">
            <NotebookPen color="#BD7650" size={20} />
            <Text className="text-sm font-black text-room-espresso">예시</Text>
          </View>
          <Text className="break-keep text-lg font-bold leading-7 text-room-espresso">
            식으니까 더 편했다.
          </Text>
          <Text className="mt-3 break-keep text-sm font-semibold leading-6 text-muted">
            다음에 다시 산다면 오후에 마시고 싶다. 과일보다 꿀 쪽이 더 기억난다.
          </Text>
          <View className="mt-4 flex-row flex-wrap gap-2">
            {['복숭아', '꿀', '다시 사고 싶음'].map(tag => (
              <View key={tag} className="rounded-full border border-[#2A1A12]/10 bg-background px-3 py-2">
                <Text className="text-xs font-black text-room-cocoa">{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="mb-4 rounded-[1.5rem] bg-room-soil p-4">
          <Text className="text-xs font-black text-room-paper/70">남겨두면 좋은 말</Text>
          <Text className="mt-2 break-keep text-lg font-bold leading-7 text-room-paper">
            비 오는 날 다시 마시기
          </Text>
        </View>

        {captureError ? (
          <View className="mb-5 rounded-[1.5rem] border border-[#BD7650]/30 bg-room-paper p-4">
            <Text className="break-keep text-sm font-bold leading-6 text-room-espresso">{captureError}</Text>
          </View>
        ) : null}

        <View className="flex-row gap-3 pb-4">
          <Pressable
            onPress={() => router.push('/note/create')}
            className="min-h-14 flex-1 flex-row items-center justify-center gap-2 rounded-full bg-room-soil px-4"
          >
            <PenLine color="#FFF8EC" size={19} />
            <Text className="text-base font-black text-room-paper">직접 쓰기</Text>
          </Pressable>
          <Pressable
            onPress={openCamera}
            className="min-h-14 flex-1 flex-row items-center justify-center gap-2 rounded-full border border-[#2A1A12]/10 bg-room-paper px-4"
          >
            <Camera color="#493024" size={19} />
            <Text className="text-base font-black text-room-espresso">사진 기록</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  if (!permission) {
    return <View className="flex-1 bg-background" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-4">
        <Text className="mb-3 text-center text-2xl font-extrabold leading-tight text-room-espresso">
          사진으로 시작하기
        </Text>
        <Text className="mb-5 text-center text-sm font-semibold leading-6 text-room-cocoa">
          원두 라벨을 붙여두려면 카메라 권한이 필요합니다. 저장 전에는 직접 고칠 수 있어요.
        </Text>
        <Pressable
          onPress={openCamera}
          className="mb-3 min-h-12 justify-center rounded-full bg-room-soil px-6"
        >
          <Text className="font-bold text-room-paper">권한 허용하기</Text>
        </Pressable>
        <Pressable onPress={() => setShowCamera(false)} className="min-h-12 justify-center rounded-full bg-room-paper px-6">
          <Text className="font-bold text-room-espresso">노트로 돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-room-espresso">
      <CameraView 
        style={StyleSheet.absoluteFill} 
        facing="back"
        ref={cameraRef}
      >
        <View className="relative flex-1 items-center justify-center">
          <View className="absolute left-5 right-5 top-16 flex-row items-center justify-between">
            <Pressable
              onPress={() => setShowCamera(false)}
              className="h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/20"
            >
              <ArrowLeft color="#FFF8EC" size={19} />
            </Pressable>
            <View className="rounded-full border border-white/20 bg-black/20 px-3 py-2">
              <Text className="text-xs font-black text-room-paper">사진 기록</Text>
            </View>
          </View>

          <View
            className="rounded-[2rem] border-2 border-room-paper/90 bg-transparent"
            style={{ height: guideHeight, width: guideWidth }}
          />
          <View className="absolute top-[45%] h-0.5 bg-room-paper shadow-lg" style={{ width: guideWidth - 10 }} />

          <View className="absolute bottom-36 left-5 right-5 rounded-[1.75rem] bg-room-paper/95 p-4">
            <Text className="text-sm font-black text-room-espresso">
              {captureError ?? '라벨을 화면 안에 맞춰주세요'}
            </Text>
            <Text className="mt-1 text-xs font-semibold leading-5 text-room-cocoa">
              읽은 정보는 다음 화면에서 직접 고칠 수 있어요.
            </Text>
          </View>

          <View className="absolute bottom-10 w-full items-center">
            <View className="mb-5 flex-row gap-3">
              <View className="rounded-2xl border border-white/20 bg-black/20 px-4 py-3">
                <Text className="text-xs font-black text-room-paper/80">어둡지 않게</Text>
              </View>
              <View className="rounded-2xl border border-white/20 bg-black/20 px-4 py-3">
                <Text className="text-xs font-black text-room-paper/80">정면으로</Text>
              </View>
            </View>
            <Pressable 
              onPress={takePicture}
              disabled={isProcessing}
              className={`h-20 w-20 items-center justify-center rounded-full border-[6px] border-room-paper/80 bg-room-paper ${isProcessing ? 'opacity-50' : 'opacity-100'}`}
            >
              {isProcessing ? <RotateCcw color="#493024" size={26} /> : <Camera color="#493024" size={26} />}
            </Pressable>
          </View>
        </View>
      </CameraView>
    </View>
  );
}
