import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { getLanguage } from '../../src/lib/auth-store';
import { t, type Lang } from '../../src/i18n';

export default function LoginScreen() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('es');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getLanguage().then(l => { if (l === 'en' || l === 'es') setLang(l); });
  }, []);

  const tx = t(lang);

  async function handleLogin() {
    if (!email.trim() || !password) return;
    setError('');
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0f1117" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={styles.appName}>{tx.appName}</Text>
            <Text style={styles.appSub}>{tx.appSubtitle}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>{tx.login.title}</Text>

            <View style={styles.field}>
              <Text style={styles.label}>{tx.login.email}</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={tx.login.emailPlaceholder}
                placeholderTextColor="#475569"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{tx.login.password}</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder={tx.login.passwordPlaceholder}
                placeholderTextColor="#475569"
                secureTextEntry
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.btn, (loading || !email || !password) && styles.btnDisabled]}
              onPress={handleLogin}
              disabled={loading || !email.trim() || !password}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>
                {loading ? tx.login.loading : tx.login.submit}
              </Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{tx.login.noAccount} </Text>
              <Link href="/(auth)/signup" style={styles.link}>
                <Text style={styles.link}>{tx.login.signupLink}</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: '#0f1117' },
  scroll:   { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header:   { alignItems: 'center', marginBottom: 36 },
  appName:  { fontSize: 36, fontWeight: '800', color: '#e2e8f0', letterSpacing: -1 },
  appSub:   { fontSize: 13, color: '#475569', marginTop: 4 },
  card:     { backgroundColor: '#1a1d27', borderRadius: 20, padding: 28, borderWidth: 1, borderColor: '#2a2d3e' },
  title:    { fontSize: 22, fontWeight: '700', color: '#e2e8f0', marginBottom: 24 },
  field:    { marginBottom: 18 },
  label:    { fontSize: 13, color: '#94a3b8', marginBottom: 8 },
  input:    {
    backgroundColor: '#0f1117', borderWidth: 1, borderColor: '#2a2d3e',
    borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, color: '#e2e8f0',
  },
  errorText:   { color: '#f87171', fontSize: 13, marginBottom: 14 },
  btn:         { backgroundColor: '#6366f1', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 4 },
  btnDisabled: { opacity: 0.5 },
  btnText:     { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer:      { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText:  { color: '#64748b', fontSize: 14 },
  link:        { color: '#818cf8', fontSize: 14, fontWeight: '600' },
});
