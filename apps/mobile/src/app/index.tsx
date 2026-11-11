import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const blue = '#1759D7';
const navy = '#132B52';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.topbar}>
          <View style={styles.mark}><Text style={styles.markText}>D</Text></View>
          <Text style={styles.brand}>devApp</Text>
          <Text style={styles.version}>v0.1</Text>
        </View>
        <View style={styles.hero}>
          <View style={styles.decor} />
          <Text style={styles.eyebrow}>YOUR WORKSPACE IS READY</Text>
          <Text style={styles.title}>새로운 아이디어,{'\n'}여기서 시작하세요.</Text>
          <Text style={styles.subtitle}>모바일 앱 개발을 위한 기본 환경이 준비되었습니다.</Text>
          <Pressable style={styles.heroButton} onPress={() => router.push('/explore')}>
            <Text style={styles.heroButtonText}>서버 연결 확인  →</Text>
          </Pressable>
        </View>
        <Text style={styles.sectionTitle}>프로젝트 현황</Text>
        <View style={styles.grid}>
          <View style={styles.tile}>
            <Text style={styles.tileIcon}>◈</Text>
            <Text style={styles.tileTitle}>모바일 UI</Text>
            <Text style={styles.tileDesc}>React Native · Expo</Text>
            <Text style={styles.ready}>● 준비 완료</Text>
          </View>
          <View style={styles.tile}>
            <Text style={styles.tileIcon}>⌘</Text>
            <Text style={styles.tileTitle}>백엔드 API</Text>
            <Text style={styles.tileDesc}>Node.js · Express</Text>
            <Text style={styles.ready}>● 구성 완료</Text>
          </View>
        </View>
        <Text style={styles.sectionTitle}>다음 단계</Text>
        <View style={styles.card}>
          {[
            ['01', '서비스 기능 설계', '핵심 기능과 사용자 흐름을 정하세요.'],
            ['02', '데이터 및 인증 연결', '필요할 때 DB와 로그인을 추가하세요.'],
            ['03', '기기에서 실행', 'Expo Go로 화면을 바로 확인하세요.'],
          ].map(([number, title, detail], i) => (
            <View key={number} style={[styles.step, i > 0 && styles.stepBorder]}>
              <Text style={styles.stepNumber}>{number}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{title}</Text>
                <Text style={styles.stepDetail}>{detail}</Text>
              </View>
            </View>
          ))}
        </View>
        <Text style={styles.footer}>BUILD SOMETHING GREAT · DEVAPP</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F4F7FC' },
  content: { paddingHorizontal: 22, paddingBottom: 36 },
  topbar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 22 },
  mark: { width: 34, height: 34, backgroundColor: blue, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  markText: { color: 'white', fontSize: 20, fontWeight: '900' },
  brand: { flex: 1, color: navy, fontSize: 20, fontWeight: '800' },
  version: { color: blue, backgroundColor: '#E6EDF9', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, fontWeight: '700' },
  hero: { backgroundColor: blue, borderRadius: 26, padding: 26, paddingVertical: 35, overflow: 'hidden', minHeight: 275 },
  decor: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 35, borderColor: '#3676E6', right: -105, top: -75 },
  eyebrow: { color: '#BBD1FF', fontSize: 10, fontWeight: '800', letterSpacing: 1.8, marginBottom: 18 },
  title: { color: 'white', fontSize: 28, fontWeight: '800', lineHeight: 39 },
  subtitle: { color: '#D9E5FF', fontSize: 13, marginTop: 12 },
  heroButton: { alignSelf: 'flex-start', marginTop: 26, backgroundColor: 'white', padding: 14, paddingHorizontal: 18, borderRadius: 12 },
  heroButtonText: { color: blue, fontWeight: '800' },
  sectionTitle: { marginTop: 30, marginBottom: 14, fontSize: 18, fontWeight: '800', color: navy },
  grid: { flexDirection: 'row', gap: 12 },
  tile: { flex: 1, backgroundColor: 'white', borderWidth: 1, borderColor: '#E6EBF3', borderRadius: 20, padding: 18 },
  tileIcon: { color: blue, fontSize: 25, marginBottom: 14 },
  tileTitle: { fontSize: 15, fontWeight: '800', color: navy, marginBottom: 6 },
  tileDesc: { color: '#64748B', fontSize: 11 },
  ready: { color: '#16996A', fontSize: 11, fontWeight: '800', marginTop: 15 },
  card: { backgroundColor: 'white', borderRadius: 20, paddingHorizontal: 18, borderWidth: 1, borderColor: '#E6EBF3' },
  step: { flexDirection: 'row', alignItems: 'center', gap: 18, paddingVertical: 18 },
  stepBorder: { borderTopWidth: 1, borderTopColor: '#E6EBF3' },
  stepNumber: { color: '#A9C3F8', fontWeight: '800', fontSize: 23 },
  stepTitle: { color: navy, fontWeight: '800', fontSize: 14 },
  stepDetail: { color: '#64748B', fontSize: 12, marginTop: 4 },
  footer: { textAlign: 'center', marginTop: 28, color: '#9CAAC2', fontSize: 10, letterSpacing: 1 },
});