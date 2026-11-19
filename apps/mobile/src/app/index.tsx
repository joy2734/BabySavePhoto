import { useCallback, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { Image, Pressable, Text, View } from 'react-native';
import { useApp } from '@/context/app';
import { api, type Care, type Photo } from '@/services/api';
import { Button, Card, ChildPicker, Heading, Input, Page, SectionTitle, colors } from '@/components/ui';

export default function HomeScreen() {
  const { token, user, selectedChild, refreshChildren } = useApp();
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [records, setRecords] = useState<Care[]>([]);
  useFocusEffect(useCallback(() => {
    if (!token || !selectedChild) return;
    void api<{ photos: Photo[] }>(`/children/${selectedChild.id}/photos`, { token }).then((album) => setPhotos(album.photos)).catch(() => {});
    if (selectedChild.ownerId === user?.id) void api<{ records: Care[] }>(`/children/${selectedChild.id}/care`, { token }).then((care) => setRecords(care.records)).catch(() => {});
    else setRecords([]);
  }, [token, selectedChild?.id, user?.id]));
  const addChild = async () => {
    if (!token) return;
    setBusy(true); setError('');
    try { await api('/children', { method: 'POST', token, body: { name, birthDate } }); await refreshChildren(); setName(''); setBirthDate(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '등록에 실패했습니다.'); }
    finally { setBusy(false); }
  };
  return <Page>
    <Heading eyebrow="SSUKSSUK CHALKAK" title={`안녕하세요, ${user?.name}님 👋`} subtitle="오늘의 작은 순간도 오래 간직해요." />
    {selectedChild ? <>
      <ChildPicker />
      <Card style={{ backgroundColor: colors.green, borderColor: colors.green, padding: 24 }}>
        <Text style={{ color: '#CDE6D4', fontSize: 13, fontWeight: '700' }}>우리 아이 성장 앨범</Text>
        <Text style={{ color: 'white', fontSize: 29, fontWeight: '800', marginTop: 8 }}>{selectedChild.name}의 오늘</Text>
        <Text style={{ color: '#E7F3EA', marginTop: 8 }}>태어난 날 {selectedChild.birthDate}</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 22 }}>
          <View style={{ backgroundColor: '#FFFFFF22', borderRadius: 13, padding: 13, flex: 1 }}><Text style={{ color: 'white', fontWeight: '800', fontSize: 22 }}>{photos.length}</Text><Text style={{ color: '#D9EBDE' }}>사진</Text></View>
          <View style={{ backgroundColor: '#FFFFFF22', borderRadius: 13, padding: 13, flex: 1 }}><Text style={{ color: 'white', fontWeight: '800', fontSize: 22 }}>{selectedChild.ownerId === user?.id ? records.length : '가족'}</Text><Text style={{ color: '#D9EBDE' }}>{selectedChild.ownerId === user?.id ? '육아 기록' : '공유 앨범'}</Text></View>
        </View>
      </Card>
      <SectionTitle title="바로 기록하기" />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Pressable onPress={() => router.push('/album')} style={{ flex: 1 }}><Card><Text style={{ fontSize: 30 }}>📷</Text><Text style={{ color: colors.ink, fontWeight: '800', marginTop: 12 }}>사진 남기기</Text><Text style={{ color: colors.muted, fontSize: 12, marginTop: 5 }}>앨범에 추가</Text></Card></Pressable>
        {selectedChild.ownerId === user?.id && <Pressable onPress={() => router.push('/care')} style={{ flex: 1 }}><Card><Text style={{ fontSize: 30 }}>🍼</Text><Text style={{ color: colors.ink, fontWeight: '800', marginTop: 12 }}>육아 기록</Text><Text style={{ color: colors.muted, fontSize: 12, marginTop: 5 }}>수유 · 수면 · 배변</Text></Card></Pressable>}
      </View>
      <SectionTitle title="최근 사진" action="전체 보기 →" onAction={() => router.push('/album')} />
      {photos.length ? <View style={{ flexDirection: 'row', gap: 8 }}>{photos.slice(0, 3).map((photo) => <Image key={photo.id} source={{ uri: photo.dataUri }} style={{ width: '31%', aspectRatio: 1, borderRadius: 14 }} />)}</View> : <Card><Text style={{ color: colors.muted }}>첫 사진을 등록해 보세요.</Text></Card>}
    </> : <Card><Text style={{ fontSize: 32, marginBottom: 12 }}>👶</Text><Text style={{ fontSize: 20, fontWeight: '800', color: colors.ink, marginBottom: 8 }}>아이를 등록해 주세요</Text><Text style={{ color: colors.muted, marginBottom: 22 }}>등록하면 앨범과 육아 기록을 시작할 수 있어요.</Text><Input label="아이 이름" value={name} onChangeText={setName} placeholder="예: 쑥쑥이" /><Input label="생년월일" value={birthDate} onChangeText={setBirthDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />{!!error && <Text style={{ color: '#C94B4B' }}>{error}</Text>}<Button title={busy ? '등록 중...' : '아이 등록'} onPress={() => void addChild()} disabled={busy} /></Card>}
  </Page>;
}
