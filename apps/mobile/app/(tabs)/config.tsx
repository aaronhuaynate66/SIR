import {
  View, Text, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { clearSession, getUserId } from '../../src/lib/auth-store';

export default function ConfigScreen() {
  const userId = getUserId();

  async function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          clearSession();
          router.replace('/login' as never);
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuración</Text>

      {userId ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>ID de usuario</Text>
          <Text style={styles.cardValue} numberOfLines={1}>{userId}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Cuenta</Text>
        <TouchableOpacity style={styles.row} onPress={handleLogout}>
          <Text style={styles.rowLabel}>Cerrar sesión</Text>
          <Text style={styles.rowIcon}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Sobre SIR</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Versión</Text>
          <Text style={styles.rowValue}>1.0.0</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f9fafb', padding: 20, gap: 20 },
  title:        { fontSize: 24, fontWeight: '700', color: '#111827' },

  card:         { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e5e7eb', gap: 4 },
  cardLabel:    { fontSize: 12, color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardValue:    { fontSize: 13, color: '#374151' },

  section:      { gap: 2 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 4, marginBottom: 4 },

  row:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#e5e7eb' },
  rowLabel:     { flex: 1, fontSize: 15, color: '#111827' },
  rowIcon:      { fontSize: 20, color: '#9ca3af' },
  rowValue:     { fontSize: 14, color: '#9ca3af' },
});
