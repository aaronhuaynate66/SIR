'use client';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, ActivityIndicator, Modal, RefreshControl,
} from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { getToken } from '../../src/lib/auth-store';

const API_URL = process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000';

interface SignalItem {
  id: string;
  type: string;
  action_recommendation: string | null;
  created_at: string;
}

const SIGNAL_LABELS: Record<string, string> = {
  relationship: 'Nueva relación', job_change: 'Cambio de trabajo',
  promotion: 'Promoción', birthday: 'Cumpleaños', achievement: 'Logro',
  life_event: 'Evento de vida', travel: 'Viaje', publication: 'Publicación',
  health_event: 'Evento de salud', loss: 'Pérdida', interaction: 'Interacción',
  emotion: 'Emoción', location: 'Ubicación', task: 'Tarea', insight: 'Insight',
};

const SIGNAL_COLORS: Record<string, string> = {
  job_change: '#6366f1', promotion: '#8b5cf6', birthday: '#f59e0b',
  achievement: '#10b981', life_event: '#3b82f6', relationship: '#ec4899',
};

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `hace ${mins}m`;
  if (hours < 24) return `hace ${hours}h`;
  return `hace ${days}d`;
}

async function fetchSignals(): Promise<SignalItem[]> {
  const token = getToken();
  if (!token) return [];
  const res = await fetch(`${API_URL}/api/signals`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json() as SignalItem[] | { signals?: SignalItem[] };
  return Array.isArray(data) ? data : (data.signals ?? []);
}

async function captureSignalText(text: string): Promise<void> {
  const token = getToken();
  if (!token) throw new Error('No active session');
  const res = await fetch(`${API_URL}/api/signals/capture`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.json() as { error?: string };
    throw new Error(err.error ?? `Error ${res.status}`);
  }
}

function SignalRow({ item }: { item: SignalItem }) {
  const color = SIGNAL_COLORS[item.type] ?? '#6b7280';
  const label = SIGNAL_LABELS[item.type] ?? item.type;
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={[styles.rowType, { color }]}>{label}</Text>
          <Text style={styles.rowTime}>{formatRelative(item.created_at)}</Text>
        </View>
        {item.action_recommendation ? (
          <Text style={styles.rowRec} numberOfLines={2}>{item.action_recommendation}</Text>
        ) : null}
      </View>
    </View>
  );
}

export default function SenalesScreen() {
  const [signals,     setSignals]     = useState<SignalItem[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [inputText,   setInputText]   = useState('');
  const [capturing,   setCapturing]   = useState(false);
  const [captureErr,  setCaptureErr]  = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchSignals();
      setSignals(data);
      setError(null);
    } catch {
      setError('Error al cargar señales');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function handleCapture() {
    if (!inputText.trim()) return;
    setCapturing(true);
    setCaptureErr(null);
    try {
      await captureSignalText(inputText.trim());
      setInputText('');
      setModalOpen(false);
      setLoading(true);
      await load();
    } catch (e) {
      setCaptureErr(e instanceof Error ? e.message : 'Error al capturar');
    } finally {
      setCapturing(false);
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); void load().finally(() => setLoading(false)); }}>
            <Text style={styles.retryBtnText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={signals}
          keyExtractor={s => s.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366f1" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📡</Text>
              <Text style={styles.emptyText}>Sin señales todavía</Text>
              <Text style={styles.emptyHint}>Pulsa + para registrar una señal manual</Text>
            </View>
          }
          renderItem={({ item }) => <SignalRow item={item} />}
        />
      )}

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setModalOpen(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Capture modal */}
      <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Registrar señal</Text>
            <Text style={styles.modalHint}>
              Describe lo que observaste. La IA extraerá el tipo de señal automáticamente.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ej: Juan cambió de trabajo a Google…"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              autoFocus
            />
            {captureErr ? <Text style={styles.captureErr}>{captureErr}</Text> : null}
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalOpen(false); setCaptureErr(null); }}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendBtn, (!inputText.trim() || capturing) && styles.sendBtnDisabled]}
                onPress={handleCapture}
                disabled={!inputText.trim() || capturing}
              >
                {capturing
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.sendBtnText}>Guardar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  list:      { padding: 16, gap: 8, paddingBottom: 88 },

  row:       { flexDirection: 'row', gap: 12, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'flex-start' },
  dot:       { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  rowBody:   { flex: 1, gap: 4 },
  rowTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowType:   { fontSize: 13, fontWeight: '700' },
  rowTime:   { fontSize: 11, color: '#9ca3af' },
  rowRec:    { fontSize: 13, color: '#374151', lineHeight: 18 },

  empty:     { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptyHint: { fontSize: 13, color: '#9ca3af' },

  errorText:     { fontSize: 14, color: '#ef4444' },
  retryBtn:      { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#6366f1', borderRadius: 10 },
  retryBtnText:  { color: '#fff', fontWeight: '600' },

  fab:       { position: 'absolute', right: 20, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 8 },
  fabText:   { color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 30 },

  overlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modal:     { width: '100%', backgroundColor: '#fff', borderRadius: 20, padding: 24, gap: 14 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalHint:  { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  modalInput: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 12, padding: 12, fontSize: 14, color: '#111827', textAlignVertical: 'top', minHeight: 90 },
  captureErr: { fontSize: 13, color: '#ef4444' },
  modalBtns:  { flexDirection: 'row', gap: 12 },
  cancelBtn:  { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: '#e5e7eb', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, color: '#6b7280', fontWeight: '600' },
  sendBtn:       { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: '#6366f1', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.45 },
  sendBtnText:   { fontSize: 15, color: '#fff', fontWeight: '700' },
});
