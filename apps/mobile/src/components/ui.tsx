import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/context/app';

export const colors = { ink: '#282B27', muted: '#7C8179', green: '#39745A', pale: '#EDF4EA', cream: '#FAF8F2', line: '#E6E8DF', orange: '#E9A56D' };
export function Page({ children }: { children: React.ReactNode }) {
  return <SafeAreaView style={styles.safe} edges={['top']}><ScrollView contentContainerStyle={styles.content}>{children}</ScrollView></SafeAreaView>;
}
export function Heading({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return <View style={{ marginBottom: 24 }}>{eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}<Text style={styles.heading}>{title}</Text>{subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}</View>;
}
export function Card({ children, style }: { children: React.ReactNode; style?: object }) { return <View style={[styles.card, style]}>{children}</View>; }
export function Button({ title, onPress, secondary, disabled }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return <Pressable onPress={onPress} disabled={disabled} style={[styles.button, secondary && styles.buttonSecondary, disabled && { opacity: 0.5 }]}><Text style={[styles.buttonText, secondary && { color: colors.green }]}>{title}</Text></Pressable>;
}
export function Input({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={{ marginBottom: 14 }}><Text style={styles.label}>{label}</Text><TextInput placeholderTextColor="#A0A69C" style={styles.input} {...props} /></View>;
}
export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return <View style={styles.sectionHead}><Text style={styles.sectionTitle}>{title}</Text>{action && <Pressable onPress={onAction}><Text style={styles.action}>{action}</Text></Pressable>}</View>;
}
export function ChildPicker() {
  const { children, selectedChild, selectChild } = useApp();
  if (!children.length) return null;
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 20 }}>{children.map((child) => <Pressable key={child.id} onPress={() => selectChild(child.id)} style={[styles.pill, selectedChild?.id === child.id && styles.pillActive]}><Text style={[styles.pillText, selectedChild?.id === child.id && { color: 'white' }]}>{child.name}</Text></Pressable>)}</ScrollView>;
}
export function Empty({ title, detail }: { title: string; detail: string }) { return <Card style={{ alignItems: 'center', paddingVertical: 38 }}><Text style={{ fontSize: 38, marginBottom: 12 }}>🌱</Text><Text style={styles.sectionTitle}>{title}</Text><Text style={[styles.subtitle, { textAlign: 'center', marginTop: 8 }]}>{detail}</Text></Card>; }
export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream }, content: { paddingHorizontal: 22, paddingTop: 24, paddingBottom: 48 },
  eyebrow: { color: colors.green, fontSize: 12, fontWeight: '800', letterSpacing: 2, marginBottom: 8 },
  heading: { fontSize: 30, lineHeight: 39, color: colors.ink, fontWeight: '800' },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 6 },
  card: { backgroundColor: '#FFF', borderRadius: 22, borderWidth: 1, borderColor: colors.line, padding: 20, marginBottom: 14 },
  button: { backgroundColor: colors.green, borderRadius: 15, paddingVertical: 15, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  buttonSecondary: { backgroundColor: colors.pale }, buttonText: { color: 'white', fontWeight: '800', fontSize: 15 },
  label: { fontSize: 13, fontWeight: '700', color: colors.ink, marginBottom: 7 },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: colors.line, borderRadius: 13, paddingHorizontal: 15, paddingVertical: 13, fontSize: 15, color: colors.ink },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.ink }, action: { fontSize: 13, fontWeight: '700', color: colors.green },
  pill: { borderRadius: 99, backgroundColor: '#FFF', borderWidth: 1, borderColor: colors.line, paddingHorizontal: 17, paddingVertical: 10 },
  pillActive: { backgroundColor: colors.green, borderColor: colors.green }, pillText: { color: colors.ink, fontWeight: '700' },
});
