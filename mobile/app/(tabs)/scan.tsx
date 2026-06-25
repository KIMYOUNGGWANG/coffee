import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!permission) {
    return <View className="flex-1 bg-background" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-4">
        <Text className="text-white text-center mb-4 text-lg">스마트 렌즈를 사용하기 위해 카메라 접근 권한이 필요합니다.</Text>
        <Pressable 
          onPress={requestPermission}
          className="bg-primary-amber px-6 py-3 rounded-full"
        >
          <Text className="text-black font-bold">권한 허용하기</Text>
        </Pressable>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current && !isProcessing) {
      setIsProcessing(true);
      try {
        const photo = await cameraRef.current.takePictureAsync({ base64: false });
        console.log('Photo captured!', photo?.width, photo?.height);
        
        // Mock AI 처리 시간 모방
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        Alert.alert(
          'AI 라벨 분석 완료! ✨', 
          '✅ 로스터리: 프릳츠 커피\n✅ 원두명: 코스타리카 볼칸 아술 게이샤\n✅ 가공방식: 화이트 허니',
          [{ text: '테이스팅 노트 작성하기', onPress: () => router.push('/note/create') }]
        );
      } catch (error) {
        console.error("Failed to take picture", error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <View className="flex-1 bg-background">
      <CameraView 
        style={StyleSheet.absoluteFill} 
        facing="back"
        ref={cameraRef}
      >
        <View className="flex-1 relative justify-center items-center">
          {/* 가이드라인 박스 */}
          <View className="w-72 h-96 border-2 border-primary-amber/80 rounded-3xl" style={{ backgroundColor: 'transparent' }} />
          <Text className="absolute top-24 text-white font-bold text-center bg-black/60 px-5 py-2 rounded-full overflow-hidden">
            원두 라벨을 사각형 안에 맞춰주세요
          </Text>
          
          {/* 셔터 영역 */}
          <View className="absolute bottom-10 w-full items-center">
            <Pressable 
              onPress={takePicture}
              disabled={isProcessing}
              className={`w-20 h-20 rounded-full border-4 border-white/30 items-center justify-center bg-black/30 ${isProcessing ? 'opacity-50' : 'opacity-100'}`}
            >
              <View className="w-16 h-16 rounded-full bg-white" />
            </Pressable>
          </View>
        </View>
      </CameraView>
    </View>
  );
}
