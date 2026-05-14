import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, StatusBar, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { getLanguage } from '../../src/lib/auth-store';
import { t, type Lang } from '../../src/i18n';

export default function SignupScreen() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>('es');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getLanguage().then(l => { if (l === 'en' || l === 'es') setLang(l); });
  }, []);

  const tx = t(lang);

  async function handleSignup() {
    if (!name.trim() || !email.trim() || !password) return;
    if (password.length < 8) {
      setError(lang === 'es' ? 'La contraseña debe tener al menos 8 caracteres.' : 'Password must be at least 8 characters.');
      return;
    }
    setError('');
    setLoading(true);
    const { error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() } },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }
    router.replace('/(tabs)');
  }

  const isValid = name.trim().length > 0 && email.trim().length > 0 && password.length >= 8;

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
            <Text style={styles.title}>{tx.signup.title}</Text>

            <View style={styles.field}>
              <Text style={styles.label}>{tx.signup.name}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={tx.signup.namePlaceholder}
                placeholderTextColor="#475569"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{tx.signup.email}</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={tx.signup.emailPlaceholder}
                placeholderTextColor="#475569"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>{tx.signup.password}</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder={tx.signup.passwordPlaceholder}
                placeholderTextColor="#475569"
                secureTextEntry
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.btn, (!isValid || loading) && styles.btnDisabled]}
              onPress={handleSignup}
              disabled={!isValid || loading}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>
                {loading ? tx.signup.loading : tx.signup.submit}
              </Text>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>{tx.signup.hasAccount} </Text>
              <Link href="/(auth)/login" style={styles.link}>
                <Text style={styles.link}>{tx.signup.loginLink}</Text>
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
