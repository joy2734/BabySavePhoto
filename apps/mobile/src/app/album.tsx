import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, Image, Modal, Pressable, Text, View } from 'react-native';
import { useApp } from '@/context/app';
import { api, type Photo } from '@/services/api';
import { Button, Card, ChildPicker, Empty, Heading, Input, Page, SectionTitle, colors } from '@/components/ui';

const dateLabel = (value: string) => new Date(value).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
export default function AlbumScreen() {
  const { token, user, selectedChild } = useApp();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selected, setSelected] = useState<Photo | null>(null);
  const [caption, setCaption] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [groupBy, setGroupBy] = useState<'date' | 'age'>('date');
  const load = useCallback(async () => {
    if (!token || !selectedChild) { setPhotos([]); return; }
    try { const result = await api<{ photos: Photo[] }>(`/children/${selectedChild.id}/photos`, { token }); setPhotos(result.photos); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '사진을 불러오지 못했습니다.'); }
  }, [token, selectedChild?.id]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const addPhoto = async () => {
    if (!token || !selectedChild) return;
    setError('');
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { setError('사진 접근 권한이 필요합니다. 기기 설정에서 허용해 주세요.'); return; }
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.55, base64: true, exif: true });
    if (picked.canceled || !picked.assets[0]) return;
    const asset = picked.assets[0];
    if (!asset.base64) { setError('사진을 읽지 못했습니다. 다시 선택해 주세요.'); return; }
    const mimeType = asset.mimeType === 'image/png' ? 'image/png' : asset.mimeType === 'image/webp' ? 'image/webp' : 'image/jpeg';
    setBusy(true);
    try {
      const exifDate = (asset.exif as Record<string, unknown> | null)?.DateTimeOriginal;
      const parsed = typeof exifDate === 'string' ? new Date(exifDate.replace(/^(\d{4}):(\d{2}):(\d{2}) /, '$1-$2-$3T')) : null;
      const takenAt = parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : new Date().toISOString();
      await api(`/children/${selectedChild.id}/photos`, { method: 'POST', token, body: { dataUri: `data:${mimeType};base64,${asset.base64}`, takenAt } });
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : '사진 등록에 실패했습니다.'); }
    finally { setBusy(false); }
  };
  const update = async (values: { caption?: string; favorite?: boolean; visibility?: 'private' | 'family' }) => {
    if (!token || !selected) return;
    setBusy(true);
    try { await api(`/photos/${selected.id}`, { method: 'PATCH', token, body: values }); await load(); setSelected(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '저장에 실패했습니다.'); }
    finally { setBusy(false); }
  };
  const remove = () => {
    if (!token || !selected) return;
    Alert.alert('사진 삭제', '이 사진을 삭제할까요?', [{ text: '취소' }, { text: '삭제', style: 'destructive', onPress: () => { void (async () => { await api(`/photos/${selected.id}`, { method: 'DELETE', token }); setSelected(null); await load(); })().catch((cause) => setError(cause instanceof Error ? cause.message : '삭제에 실패했습니다.')); } }]);
  };
  const toggleLike = async () => {
    if (!token || !selected) return;
    try { const result = await api<{ likes: string[] }>(`/photos/${selected.id}/likes`, { method: 'POST', token }); setSelected({ ...selected, likes: result.likes }); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '좋아요를 저장하지 못했습니다.'); }
  };
  const addComment = async () => {
    if (!token || !selected || !comment.trim()) return;
    try { const result = await api<{ comment: Photo['comments'][number] }>(`/photos/${selected.id}/comments`, { method: 'POST', token, body: { body: comment } }); setSelected({ ...selected, comments: [...(selected.comments ?? []), result.comment] }); setComment(''); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '댓글을 저장하지 못했습니다.'); }
  };
  const groups = photos.reduce<Record<string, Photo[]>>((acc, photo) => {
    const captured = new Date(photo.takenAt);
    let key = captured.toLocaleDateString('sv-SE').slice(0, 7);
    if (groupBy === 'age' && selectedChild) {
      const [year, month, day] = selectedChild.birthDate.split('-').map(Number);
      const months = (captured.getFullYear() - year) * 12 + captured.getMonth() + 1 - month - (captured.getDate() < day ? 1 : 0);
      key = months < 0 ? '출생 전' : `${months}개월`;
    }
    (acc[key] ??= []).push(photo);
    return acc;
  }, {});
  return <Page>
    <Heading eyebrow="OUR MOMENTS" title="성장 앨범" subtitle="날짜별로 모인 소중한 순간들이에요." />
    <ChildPicker />
    {!selectedChild ? <Empty title="아이를 먼저 등록해 주세요" detail="홈에서 아이 프로필을 만들면 앨범을 시작할 수 있어요." /> : <>
      <Button title={busy ? '사진 등록 중...' : '+ 사진 추가하기'} onPress={() => void addPhoto()} disabled={busy} />
      {!!error && <Text style={{ color: '#C94B4B', marginTop: 12 }}>{error}</Text>}
      {photos.length > 0 && <View style={{ flexDirection: 'row', gap: 8, marginTop: 22 }}><Pressable onPress={() => setGroupBy('date')} style={{ backgroundColor: groupBy === 'date' ? colors.green : colors.pale, borderRadius: 99, paddingHorizontal: 16, paddingVertical: 10 }}><Text style={{ color: groupBy === 'date' ? 'white' : colors.green, fontWeight: '800' }}>날짜별</Text></Pressable><Pressable onPress={() => setGroupBy('age')} style={{ backgroundColor: groupBy === 'age' ? colors.green : colors.pale, borderRadius: 99, paddingHorizontal: 16, paddingVertical: 10 }}><Text style={{ color: groupBy === 'age' ? 'white' : colors.green, fontWeight: '800' }}>개월별</Text></Pressable></View>}
      {photos.length === 0 ? <View style={{ marginTop: 24 }}><Empty title="아직 사진이 없어요" detail="첫 사진을 추가해 성장 앨범을 채워 보세요." /></View> : Object.entries(groups).map(([month, items]) => <View key={month}><SectionTitle title={groupBy === 'date' ? `${month.replace('-', '년 ')}월` : month} /><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{items.map((photo) => <Pressable key={photo.id} onPress={() => { setSelected(photo); setCaption(photo.caption); }} style={{ width: '31%', position: 'relative' }}><Image source={{ uri: photo.dataUri }} style={{ width: '100%', aspectRatio: 1, borderRadius: 13 }} />{photo.favorite && <Text style={{ position: 'absolute', right: 8, top: 6, color: '#F35E5E', fontSize: 20 }}>♥</Text>}</Pressable>)}</View></View>)}
    </>}
    <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}><Page>{selected && <>
      <Pressable onPress={() => setSelected(null)}><Text style={{ color: colors.green, fontWeight: '800', marginBottom: 18 }}>← 앨범으로</Text></Pressable>
      <Image source={{ uri: selected.dataUri }} resizeMode="contain" style={{ width: '100%', aspectRatio: 1, backgroundColor: '#F1F1EE', borderRadius: 18 }} />
      <Text style={{ color: colors.muted, marginTop: 14 }}>{dateLabel(selected.takenAt)}</Text>
      {selected.ownerId === user?.id ? <><View style={{ marginTop: 22 }}><Input label="사진 기록" value={caption} onChangeText={setCaption} placeholder="이 순간을 한 줄로 남겨보세요" multiline /></View><Button title={busy ? '저장 중...' : '기록 저장'} onPress={() => void update({ caption })} disabled={busy} /><Button title={selected.favorite ? '♥ 즐겨찾기 해제' : '♡ 즐겨찾기'} secondary onPress={() => void update({ favorite: !selected.favorite })} disabled={busy} /><Button title={selected.visibility === 'family' ? '가족 공개 중 · 비공개로 변경' : '비공개 · 가족에게 공개하기'} secondary onPress={() => void update({ visibility: selected.visibility === 'family' ? 'private' : 'family' })} disabled={busy} /></> : <Text style={{ color: colors.ink, fontSize: 17, marginTop: 18 }}>{selected.caption || '사진 기록이 없습니다.'}</Text>}
      <View style={{ borderTopWidth: 1, borderTopColor: colors.line, marginTop: 22, paddingTop: 18 }}><Pressable onPress={() => void toggleLike()}><Text style={{ color: colors.green, fontWeight: '800' }}>{selected.likes?.includes(user?.id ?? '') ? '♥' : '♡'} 좋아요 {selected.likes?.length ?? 0}</Text></Pressable><Text style={{ color: colors.ink, fontWeight: '800', marginTop: 18, marginBottom: 10 }}>댓글 {selected.comments?.length ?? 0}</Text>{selected.comments?.map((item) => <Text key={item.id} style={{ color: colors.ink, marginBottom: 7 }}><Text style={{ fontWeight: '800' }}>{item.name} </Text>{item.body}</Text>)}<View style={{ marginTop: 8 }}><Input label="댓글 남기기" value={comment} onChangeText={setComment} placeholder="따뜻한 한마디를 남겨보세요" /></View><Button title="댓글 등록" secondary onPress={() => void addComment()} disabled={!comment.trim()} /></View>
      {selected.ownerId === user?.id && <Pressable onPress={remove} style={{ alignItems: 'center', padding: 18 }}><Text style={{ color: '#C94B4B' }}>사진 삭제</Text></Pressable>}
    </>}</Page></Modal>
  </Page>;
}
