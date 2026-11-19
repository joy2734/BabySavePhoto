import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useApp } from '@/context/app';
import { api, type Notification } from '@/services/api';
import { Card, Empty, Heading, Page, colors } from '@/components/ui';

export default function NotificationsScreen() {
  const { token, selectChild } = useApp();
  const [items, setItems] = useState<Notification[]>([]);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!token) return;
    try { const result = await api<{ notifications: Notification[] }>('/notifications', { token }); setItems(result.notifications); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '알림을 불러오지 못했습니다.'); }
  }, [token]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const open = async (item: Notification) => {
    if (!token) return;
    try {
      if (!item.readAt) await api(`/notifications/${item.id}/read`, { method: 'PATCH', token });
      selectChild(item.childId);
      router.push('/album');
    } catch (cause) { setError(cause instanceof Error ? cause.message : '알림을 열지 못했습니다.'); }
  };
  return <Page>
    <Heading eyebrow="FAMILY ACTIVITY" title="알림" subtitle="가족 앨범의 새로운 소식을 확인해요." />
    {!!error && <Text style={{ color: '#C94B4B', marginBottom: 14 }}>{error}</Text>}
    {!items.length ? <Empty title="아직 알림이 없어요" detail="가족이 앨범에 참여하거나 사진에 반응하면 여기에 보여요." /> : items.map((item) => <Pressable key={item.id} onPress={() => void open(item)}><Card style={{ backgroundColor: item.readAt ? '#FFF' : colors.pale }}><View style={{ flexDirection: 'row', gap: 12 }}><Text style={{ fontSize: 24 }}>{item.photoId ? '💚' : '👨‍👩‍👧'}</Text><View style={{ flex: 1 }}><Text style={{ color: colors.ink, fontWeight: item.readAt ? '500' : '800', lineHeight: 21 }}>{item.message}</Text><Text style={{ color: colors.muted, fontSize: 12, marginTop: 7 }}>{new Date(item.createdAt).toLocaleString('ko-KR')}</Text></View>{!item.readAt && <Text style={{ color: colors.green }}>●</Text>}</View></Card></Pressable>)}
  </Page>;
}
