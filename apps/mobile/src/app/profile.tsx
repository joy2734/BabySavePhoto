import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useApp } from '@/context/app';
import { api, type User } from '@/services/api';
import { Button, Card, ChildPicker, Heading, Input, Page, SectionTitle, colors } from '@/components/ui';

export default function ProfileScreen() {
  const { token, user, selectedChild, refreshChildren, updateProfile, logout } = useApp();
  const [accountName, setAccountName] = useState('');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState<{ code: string; expiresAt: string } | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [members, setMembers] = useState<User[]>([]);
  useEffect(() => { setAccountName(user?.name ?? ''); }, [user?.name]);
  useEffect(() => { setName(selectedChild?.name ?? ''); setBirthDate(selectedChild?.birthDate ?? ''); }, [selectedChild?.id, selectedChild?.name, selectedChild?.birthDate]);
  useEffect(() => {
    setInvite(null);
    if (token && selectedChild) void api<{ members: User[] }>(`/children/${selectedChild.id}/members`, { token }).then((result) => setMembers(result.members)).catch(() => setMembers([]));
  }, [token, selectedChild?.id]);
  const save = async () => {
    if (!selectedChild || !token) return;
    setBusy(true); setError(''); setMessage('');
    try { await api(`/children/${selectedChild.id}`, { method: 'PATCH', token, body: { name, birthDate } }); await refreshChildren(); setMessage('아이 정보가 저장되었습니다.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '저장에 실패했습니다.'); }
    finally { setBusy(false); }
  };
  const saveAccount = async () => {
    setBusy(true); setError(''); setMessage('');
    try { await updateProfile({ name: accountName }); setMessage('계정 정보가 저장되었습니다.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '계정 정보를 저장하지 못했습니다.'); }
    finally { setBusy(false); }
  };
  const makeInvite = async () => {
    if (!token || !selectedChild) return;
    setBusy(true); setError('');
    try { const result = await api<{ invite: { code: string; expiresAt: string } }>(`/children/${selectedChild.id}/invites`, { method: 'POST', token }); setInvite(result.invite); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '초대 코드를 만들지 못했습니다.'); }
    finally { setBusy(false); }
  };
  const join = async () => {
    if (!token) return;
    setBusy(true); setError(''); setMessage('');
    try { await api('/family/join', { method: 'POST', token, body: { code: joinCode } }); await refreshChildren(); setJoinCode(''); setMessage('가족 앨범에 참여했습니다.'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : '참여하지 못했습니다.'); }
    finally { setBusy(false); }
  };
  return <Page>
    <Heading eyebrow="MY FAMILY" title="내 정보" subtitle="계정과 아이 프로필을 관리해요." />
    <Card><Text style={{ color: colors.muted, marginBottom: 14 }}>보호자 계정 · {user?.email}</Text><Input label="표시 이름" value={accountName} onChangeText={setAccountName} placeholder="보호자 이름" /><Button title={busy ? '저장 중...' : '계정 정보 저장'} onPress={() => void saveAccount()} disabled={busy || !accountName.trim()} /></Card>
    <SectionTitle title="아이 프로필" />
    <ChildPicker />
    {selectedChild?.ownerId === user?.id && <Card><Input label="아이 이름" value={name} onChangeText={setName} /><Input label="생년월일" value={birthDate} onChangeText={setBirthDate} placeholder="YYYY-MM-DD" /><Button title={busy ? '저장 중...' : '변경사항 저장'} onPress={() => void save()} disabled={busy} /></Card>}
    <SectionTitle title="가족 앨범" />
    {selectedChild && <Card><Text style={{ color: colors.ink, fontWeight: '800', marginBottom: 8 }}>{selectedChild.name}의 가족</Text><Text style={{ color: colors.muted, marginBottom: 14 }}>{members.map((member) => member.name).join(' · ') || '가족 정보를 불러오는 중입니다.'}</Text>{selectedChild.ownerId === user?.id && <><Button title="초대 코드 만들기" secondary onPress={() => void makeInvite()} disabled={busy} />{invite && <View style={{ backgroundColor: colors.pale, borderRadius: 12, padding: 15, marginTop: 14 }}><Text selectable style={{ color: colors.green, fontSize: 22, fontWeight: '800', letterSpacing: 2 }}>{invite.code}</Text><Text style={{ color: colors.muted, marginTop: 5, fontSize: 12 }}>24시간 동안 1회 사용할 수 있어요.</Text></View>}</>}</Card>}
    <Card><Input label="초대 코드로 참여" value={joinCode} onChangeText={setJoinCode} autoCapitalize="characters" placeholder="가족에게 받은 코드 입력" /><Button title="가족 앨범 참여" secondary onPress={() => void join()} disabled={busy || !joinCode.trim()} /></Card>
    {!!error && <Text style={{ color: '#C94B4B' }}>{error}</Text>}{!!message && <Text style={{ color: colors.green }}>{message}</Text>}
    <SectionTitle title="계정" />
    <Button title="로그아웃" secondary onPress={() => void logout()} />
    <View style={{ height: 20 }} />
    <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>현재 데이터는 개발 서버에 저장됩니다. AI 생성과 결제 기능은 후속 개발 단계입니다.</Text>
  </Page>;
}
