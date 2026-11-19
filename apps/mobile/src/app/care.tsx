import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, Pressable, Text, View } from 'react-native';
import { useApp } from '@/context/app';
import { api, type Care } from '@/services/api';
import { Button, Card, ChildPicker, Empty, Heading, Input, Page, SectionTitle, colors } from '@/components/ui';

type Kind = Care['type'];
const names: Record<Kind, string> = { feeding: '수유', sleep: '수면', diaper: '배변' };
const icons: Record<Kind, string> = { feeding: '🍼', sleep: '😴', diaper: '🧷' };
const localDateTime = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
const parseLocal = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(value.replace(' ', 'T'));
  return Number.isNaN(date.getTime()) || localDateTime(date) !== value ? null : date.toISOString();
};
export default function CareScreen() {
  const { token, user, selectedChild } = useApp();
  const [records, setRecords] = useState<Care[]>([]);
  const [kind, setKind] = useState<Kind>('feeding');
  const [start, setStart] = useState(localDateTime(new Date(Date.now() - 20 * 60000)));
  const [end, setEnd] = useState(localDateTime(new Date()));
  const [detail, setDetail] = useState('분유');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!token || !selectedChild || selectedChild.ownerId !== user?.id) { setRecords([]); return; }
    try { const result = await api<{ records: Care[] }>(`/children/${selectedChild.id}/care`, { token }); setRecords(result.records); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '기록을 불러오지 못했습니다.'); }
  }, [token, selectedChild?.id, user?.id]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const save = async () => {
    if (!token || !selectedChild) return;
    const startedAt = parseLocal(start), endedAt = parseLocal(end);
    if (!startedAt || (kind !== 'diaper' && (!endedAt || Date.parse(endedAt) <= Date.parse(startedAt)))) { setError('시작·종료 시간을 YYYY-MM-DD HH:mm 형식으로 확인해 주세요.'); return; }
    if (kind === 'feeding' && amount && (!Number.isFinite(Number(amount)) || Number(amount) < 0)) { setError('수유량은 0 이상의 숫자로 입력해 주세요.'); return; }
    setBusy(true); setError('');
    try {
      await api(`/children/${selectedChild.id}/care`, { method: 'POST', token, body: { type: kind, startedAt, ...(kind !== 'diaper' ? { endedAt } : {}), detail: detail || (kind === 'sleep' ? '수면' : ''), ...(kind === 'feeding' && amount ? { amountMl: Number(amount) } : {}), memo } });
      setMemo(''); setAmount(''); setStart(localDateTime(new Date(Date.now() - 20 * 60000))); setEnd(localDateTime(new Date()));
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : '저장에 실패했습니다.'); }
    finally { setBusy(false); }
  };
  const remove = (record: Care) => Alert.alert('기록 삭제', '이 기록을 삭제할까요?', [{ text: '취소' }, { text: '삭제', style: 'destructive', onPress: () => { if (!token) return; void api(`/care/${record.id}`, { method: 'DELETE', token }).then(load).catch((cause) => setError(cause instanceof Error ? cause.message : '삭제에 실패했습니다.')); } }]);
  const today = new Date().toDateString();
  const todayRecords = records.filter((record) => new Date(record.startedAt).toDateString() === today);
  const sleepMinutes = todayRecords.filter((item) => item.type === 'sleep' && item.endedAt).reduce((sum, item) => sum + Math.round((Date.parse(item.endedAt!) - Date.parse(item.startedAt)) / 60000), 0);
  return <Page>
    <Heading eyebrow="DAILY CARE" title="육아 기록" subtitle="수유, 수면, 배변을 간편하게 남겨요." />
    <ChildPicker />
    {!selectedChild ? <Empty title="아이를 먼저 등록해 주세요" detail="홈에서 아이 프로필을 만들면 기록을 시작할 수 있어요." /> : selectedChild.ownerId !== user?.id ? <Empty title="보호자 전용 기록이에요" detail="가족에게 공유된 사진은 앨범에서 볼 수 있어요." /> : <>
      <Card style={{ backgroundColor: colors.pale, borderColor: colors.pale }}><Text style={{ color: colors.green, fontWeight: '800', marginBottom: 14 }}>오늘의 기록</Text><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: colors.ink }}>🍼 수유 {todayRecords.filter((item) => item.type === 'feeding').length}회</Text><Text style={{ color: colors.ink }}>😴 수면 {Math.floor(sleepMinutes / 60)}시간 {sleepMinutes % 60}분</Text><Text style={{ color: colors.ink }}>🧷 배변 {todayRecords.filter((item) => item.type === 'diaper').length}회</Text></View></Card>
      <SectionTitle title="새 기록" />
      <Card>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>{(['feeding', 'sleep', 'diaper'] as const).map((type) => <Pressable key={type} onPress={() => { setKind(type); setDetail(type === 'feeding' ? '분유' : type === 'diaper' ? '소변' : '수면'); }} style={{ flex: 1, borderRadius: 12, padding: 12, backgroundColor: kind === type ? colors.green : colors.pale, alignItems: 'center' }}><Text style={{ color: kind === type ? 'white' : colors.green, fontWeight: '800' }}>{icons[type]} {names[type]}</Text></Pressable>)}</View>
        <Input label={kind === 'diaper' ? '발생 시간' : '시작 시간'} value={start} onChangeText={setStart} placeholder="YYYY-MM-DD HH:mm" />
        {kind !== 'diaper' && <Input label="종료 시간" value={end} onChangeText={setEnd} placeholder="YYYY-MM-DD HH:mm" />}
        {kind !== 'sleep' && <Input label={kind === 'feeding' ? '수유 유형' : '배변 유형'} value={detail} onChangeText={setDetail} placeholder={kind === 'feeding' ? '모유 / 분유 / 이유식' : '소변 / 대변 / 모두'} />}
        {kind === 'feeding' && <Input label="수유량 (ml, 선택)" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="예: 120" />}
        <Input label="메모 (선택)" value={memo} onChangeText={setMemo} placeholder="특별한 점을 남겨주세요" />
        {!!error && <Text style={{ color: '#C94B4B', marginBottom: 8 }}>{error}</Text>}
        <Button title={busy ? '저장 중...' : `${names[kind]} 기록 저장`} onPress={() => void save()} disabled={busy} />
      </Card>
      <SectionTitle title="최근 기록" />
      {!records.length ? <Empty title="아직 기록이 없어요" detail="첫 육아 기록을 남겨 보세요." /> : records.map((record) => <Card key={record.id}><View style={{ flexDirection: 'row', alignItems: 'center' }}><Text style={{ fontSize: 26, marginRight: 12 }}>{icons[record.type]}</Text><View style={{ flex: 1 }}><Text style={{ color: colors.ink, fontWeight: '800', fontSize: 16 }}>{names[record.type]} · {record.detail}</Text><Text style={{ color: colors.muted, marginTop: 5 }}>{new Date(record.startedAt).toLocaleString('ko-KR')}{record.endedAt ? ` ~ ${new Date(record.endedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}` : ''}</Text>{record.amountMl !== undefined && <Text style={{ color: colors.green, marginTop: 4 }}>{record.amountMl} ml</Text>}{!!record.memo && <Text style={{ color: colors.muted, marginTop: 4 }}>{record.memo}</Text>}</View><Pressable onPress={() => remove(record)}><Text style={{ color: colors.muted, padding: 8 }}>삭제</Text></Pressable></View></Card>)}
    </>}
  </Page>;
}
