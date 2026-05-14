import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { setLanguage } from '../../src/lib/auth-store';
import type { Lang } from '../../src/i18n';

export default function LanguageScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<Lang>('es');

  async function handleContinue() {
    await setLanguage(selected);
    router.replace('/(auth)/login');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0f1117" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.appName}>SIR</Text>
          <Text style={styles.appSub}>Sistema de Inteligencia Relacional</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Elige tu idioma</Text>
          <Text style={styles.subtitle}>Choose your language</Text>

          <View style={styles.options}>
            {([
              { lang: 'es' as Lang, flag: '🇲🇽', label: 'Español' },
              { lang: 'en' as Lang, flag: '🇺🇸', label: 'English' },
            ] as const).map(({ lang, flag, label }) => (
              <TouchableOpacity
                key={lang}
                onPress={() => setSelected(lang)}
                style={[styles.option, selected === lang && styles.optionSelected]}
                activeOpacity={0.8}
              >
                <Text style={styles.flag}>{flag}</Text>
                <Text style={[styles.optionLabel, selected === lang && styles.optionLabelSelected]}>
                  {label}
                </Text>
                {selected === lang && (
                  <View style={styles.check}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.btn} onPress={handleContinue} activeOpacity={0.85}>
            <Text style={styles.btnText}>Continuar / Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:       { flex: 1, backgroundColor: '#0f1117' },
  container:  { flex: 1, justifyContent: 'center', padding: 24 },
  header:     { alignItems: 'center', marginBottom: 40 },
  appName:    { fontSize: 40, fontWeight: '800', color: '#e2e8f0', letterSpacing: -1 },
  appSub:     { fontSize: 14, color: '#475569', marginTop: 4 },
  card:       { backgroundColor: '#1a1d27', borderRadius: 20, padding: 28, borderWidth: 1, borderColor: '#2a2d3e' },
  title:      { fontSize: 22, fontWeight: '700', color: '#e2e8f0', textAlign: 'center', marginBottom: 4 },
  subtitle:   { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 28 },
  options:    { gap: 12, marginBottom: 28 },
  option:     {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 12,
    backgroundColor: '#0f1117', borderWidth: 1, borderColor: '#2a2d3e',
  },
  optionSelected: { borderColor: '#6366f1', backgroundColor: '#1e1b4b' },
  flag:           { fontSize: 28 },
  optionLabel:    { flex: 1, fontSize: 17, fontWeight: '500', color: '#94a3b8' },
  optionLabelSelected: { color: '#e2e8f0', fontWeight: '600' },
  check:          { width: 24, height: 24, borderRadius: 12, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' },
  checkText:      { color: '#fff', fontSize: 13, fontWeight: '700' },
  btn:            { backgroundColor: '#6366f1', borderRadius: 12, padding: 16, alignItems: 'center' },
  btnText:        { color: '#fff', fontSize: 16, fontWeight: '700' },
});
