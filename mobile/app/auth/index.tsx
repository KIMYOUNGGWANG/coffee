import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) Alert.alert('로그인 실패', error.message);
    setLoading(false);
  }

  return (
    <View className="flex-1 justify-center bg-background px-6">
      <View className="items-center mb-10">
        <Text className="text-primary-amber font-serif font-black text-5xl tracking-tighter shadow-sm">CoffeeDex</Text>
        <Text className="text-muted mt-2 font-bold text-sm">나만의 프리미엄 테이스팅 노트</Text>
      </View>

      <View className="bg-surface p-6 rounded-[2rem] border border-white/5 shadow-2xl">
        <TextInput
          className="bg-background text-white px-5 py-4 rounded-xl border border-white/10 mb-4 font-bold"
          placeholder="이메일"
          placeholderTextColor="#737373"
          onChangeText={(text) => setEmail(text)}
          value={email}
          autoCapitalize={'none'}
        />
        <TextInput
          className="bg-background text-white px-5 py-4 rounded-xl border border-white/10 mb-6 font-bold"
          placeholder="비밀번호"
          placeholderTextColor="#737373"
          secureTextEntry={true}
          onChangeText={(text) => setPassword(text)}
          value={password}
          autoCapitalize={'none'}
        />
        <Pressable 
          className="bg-primary-amber py-4 rounded-xl items-center"
          onPress={signInWithEmail}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text className="text-black font-extrabold text-lg">로그인</Text>
          )}
        </Pressable>
        
        <View className="mt-6 flex-row justify-center gap-6">
          <Text className="text-muted text-xs font-bold">애플 로그인 (준비중)</Text>
          <Text className="text-muted text-xs font-bold">카카오 로그인 (준비중)</Text>
        </View>

        <Pressable 
          className="mt-8 border border-white/10 py-3 rounded-xl items-center"
          onPress={() => {
            router.replace('/(tabs)');
          }}
        >
          <Text className="text-muted font-bold">테스트 환경으로 바로 입장하기 🚀</Text>
        </Pressable>
      </View>
    </View>
  );
}
