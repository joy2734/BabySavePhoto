import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useApp } from '@/context/app';
import { Button, Card, Heading, Input, Page, colors } from './ui';

export function AuthScreen() {
  const { authenticate } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async () => {
    if (mode === 'register' && (!name.trim() || password !== confirm || !agreed)) { setError('이름, 비밀번호 확인, 데이터 저장 안내를 확인해 주세요.'); return; }
    setBusy(true); setError('');
    try { await authenticate(mode, { name, email, password }); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '로그인에 실패했습니다.'); }
    finally { setBusy(false); }
  };
  return <Page>
    <View style={{ paddingTop: 42, paddingBottom: 20 }}><Text style={{ fontSize: 48 }}>🌱</Text></View>
    <Heading eyebrow="쑥쑥찰칵" title={'우리 아이의 매일을\n차곡차곡 담아요'} subtitle="사진과 육아 기록을 한곳에서 시작해 보세요." />
    <Card>
      <View style={{ flexDirection: 'row', marginBottom: 20, gap: 8 }}>{(['register', 'login'] as const).map((item) => <Pressable key={item} onPress={() => { setMode(item); setError(''); }} style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: mode === item ? colors.pale : '#F7F7F3', alignItems: 'center' }}><Text style={{ color: mode === item ? colors.green : colors.muted, fontWeight: '800' }}>{item === 'register' ? '회원가입' : '로그인'}</Text></Pressable>)}</View>
      {mode === 'register' && <Input label="이름" value={name} onChangeText={setName} placeholder="보호자 이름" />}
      <Input label="이메일" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@example.com" />
      <Input label="비밀번호" value={password} onChangeText={setPassword} secureTextEntry placeholder="8자 이상" />
      {mode === 'register' && <><Input label="비밀번호 확인" value={confirm} onChangeText={setConfirm} secureTextEntry placeholder="비밀번호 다시 입력" /><Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: 8 }}>이 앱은 개발 버전입니다. 입력한 계정, 아이 정보와 사진은 연결된 개발 서버에 저장됩니다.</Text><Pressable onPress={() => setAgreed(!agreed)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}><Text style={{ color: colors.green, fontSize: 18 }}>{agreed ? '☑' : '□'}</Text><Text style={{ color: colors.ink, fontSize: 13 }}>개발용 데이터 저장 안내를 확인했습니다.</Text></Pressable></>}
      {!!error && <Text style={{ color: '#C94B4B', marginTop: 8 }}>{error}</Text>}
      {busy ? <ActivityIndicator style={{ marginTop: 24 }} color={colors.green} /> : <Button title={mode === 'register' ? '시작하기' : '로그인'} onPress={() => void submit()} />}
    </Card>
  </Page>;
}
