import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { checkApiHealth } from '@/services/api';

type Connection = 'checking' | 'online' | 'offline';
export default function ConnectionScreen() {
  const [status, setStatus] = useState<Connection>('checking');
  const [detail, setDetail] = useState('');
  const check = useCallback(async () => {
    setStatus('checking');
    try {
      const response = await checkApiHealth();
      setDetail(`서버 응답: ${response.service} · ${response.status}`);
      setStatus('online');
    } catch (error) {
      setDetail(error instanceof Error ? error.message : '알 수 없는 연결 오류');
      setStatus('offline');
    }
  }, []);
  useEffect(() => { void check(); }, [check]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>DEVELOPMENT / API</Text>
        <Text style={styles.title}>서버 연결</Text>
        <Text style={styles.description}>앱과 개발 서버가 통신할 수 있는지 확인합니다.</Text>
        <View style={styles.panel}>
          <View style={styles.row}>
            <Text style={styles.label}>연결 상태</Text>
            {status === 'checking' ? <ActivityIndicator color="#1759D7" /> :
              <View style={[styles.dot, { backgroundColor: status === 'online' ? '#12A574' : '#E45656' }]} />}
          </View>
          <Text style={styles.state}>{status === 'checking' ? '서버 확인 중...' : status === 'online' ? '연결 성공' : '연결되지 않음'}</Text>
          <Text style={styles.detail}>{detail || 'API 상태 확인 요청을 전송하고 있습니다.'}</Text>
          <Pressable style={styles.button} onPress={() => void check()} disabled={status === 'checking'}>
            <Text style={styles.buttonText}>다시 확인</Text>
          </Pressable>
        </View>
        <Text style={styles.sectionLabel}>API BASE URL</Text>
        <View style={styles.codeBox}>
          <Text selectable style={styles.code}>{process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000'}</Text>
        </View>
        <Text style={styles.hint}>실제 휴대폰에서 테스트할 경우 localhost 대신 개발 PC의 같은 Wi-Fi 네트워크 IP를 설정하세요. 변경 후 Expo를 다시 시작해야 합니다.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F7FC' },
  content: { padding: 24, paddingTop: 35 },
  kicker: { color: '#1759D7', fontSize: 11, letterSpacing: 1.5, fontWeight: '800' },
  title: { marginTop: 10, color: '#132B52', fontSize: 30, fontWeight: '800' },
  description: { marginTop: 10, color: '#64748B', fontSize: 14, lineHeight: 22 },
  panel: { marginTop: 32, backgroundColor: 'white', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#E6EBF3' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: '#64748B', fontSize: 13, fontWeight: '700' },
  dot: { width: 12, height: 12, borderRadius: 6 },
  state: { color: '#132B52', fontWeight: '800', fontSize: 26, marginTop: 12 },
  detail: { color: '#64748B', fontSize: 12, marginTop: 10, lineHeight: 20 },
  button: { backgroundColor: '#1759D7', borderRadius: 13, paddingVertical: 15, alignItems: 'center', marginTop: 25 },
  buttonText: { color: 'white', fontWeight: '800', fontSize: 14 },
  sectionLabel: { color: '#64748B', fontSize: 11, fontWeight: '800', letterSpacing: 1.2, marginTop: 35, marginBottom: 12 },
  codeBox: { borderRadius: 14, backgroundColor: '#E8EEF8', padding: 17 },
  code: { color: '#1759D7', fontSize: 13, fontWeight: '700' },
  hint: { color: '#64748B', fontSize: 12, marginTop: 16, lineHeight: 20 },
});