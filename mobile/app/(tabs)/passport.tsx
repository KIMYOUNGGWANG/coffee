import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { Coffee, Award, MapPin } from "lucide-react-native";

export default function PassportScreen() {
  return (
    <ScrollView className="flex-1 bg-background pt-16 px-4">
      <View className="mb-6">
        <Text className="text-white text-3xl font-serif font-black tracking-tight">커피 패스포트</Text>
        <Text className="text-primary-amber mt-1 text-sm font-bold">당신의 테이스팅 여정</Text>
      </View>

      <View className="bg-surface p-6 rounded-[2rem] border border-white/5 mb-6 flex-row items-center justify-between shadow-lg">
        <View>
          <Text className="text-muted text-sm font-bold mb-1">총 테이스팅</Text>
          <Text className="text-white text-4xl font-serif font-black">24<Text className="text-primary-amber text-xl">잔</Text></Text>
        </View>
        <View className="w-16 h-16 bg-primary-amber/10 rounded-full items-center justify-center">
          <Coffee color="#D4AF37" size={32} />
        </View>
      </View>

      <Text className="text-white font-bold text-lg mb-4">수집한 배지</Text>
      <View className="flex-row gap-4 mb-8">
        <Pressable 
          className="w-28 h-28 bg-surface border border-white/5 rounded-2xl items-center justify-center shadow-lg"
          onPress={() => Alert.alert('에티오피아 마스터', '에티오피아 원두를 10번 이상 기록하셨습니다! 🏆')}
        >
          <Award color="#D4AF37" size={32} />
          <Text className="text-white text-xs mt-3 font-bold text-center">에티오피아{'\n'}마스터</Text>
        </Pressable>
        <Pressable 
          className="w-28 h-28 bg-surface border border-white/5 rounded-2xl items-center justify-center opacity-50 shadow-lg"
          onPress={() => Alert.alert('잠긴 배지', '게이샤 원두를 5번 이상 기록하면 획득할 수 있습니다. 🔒')}
        >
          <MapPin color="#737373" size={32} />
          <Text className="text-muted text-xs mt-3 font-bold text-center">게이샤{'\n'}탐험가</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
