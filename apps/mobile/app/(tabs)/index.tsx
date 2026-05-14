import {
  View, Text, TextInput, FlatList,
  TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useState, useRef } from 'react';
import { useSignals } from '../../src/hooks/useSignals';

interface Message {
  id: string;
  text: string;
  role: 'user' | 'system';
  layers?: string[];
}

export default function ConversationScreen() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const listRef = useRef<FlatList>(null);
  const { send, loading, error } = useSignals();

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    const userMsg: Message = { id: Date.now().toString(), text, role: 'user' };
    setMessages((m) => [...m, userMsg]);

    const result = await send('interaction', { message: text });

    const sysMsg: Message = {
      id: `${Date.now()}-sys`,
      role: 'system',
      text: result
        ? `Procesado. Capas: ${result.layersActivated.join(', ')}`
        : 'Error al procesar.',
      layers: result?.layersActivated,
    };
    setMessages((m) => [...m, sysMsg]);
    setTimeout(() => listRef.current?.scrollToEnd(), 100);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.sysBubble]}>
            <Text style={item.role === 'user' ? styles.userText : styles.sysText}>
              {item.text}
            </Text>
          </View>
        )}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Escribe algo..."
          placeholderTextColor="#9ca3af"
          onSubmitEditing={handleSend}
          returnKeyType="send"
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, (loading || !input.trim()) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={loading || !input.trim()}
        >
          <Text style={styles.sendBtnText}>{loading ? '...' : 'Enviar'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f9fafb' },
  list:         { padding: 16, gap: 8 },
  bubble:       { maxWidth: '80%', borderRadius: 12, padding: 12 },
  userBubble:   { alignSelf: 'flex-end', backgroundColor: '#6366f1' },
  sysBubble:    { alignSelf: 'flex-start', backgroundColor: '#e5e7eb' },
  userText:     { color: '#fff', fontSize: 15 },
  sysText:      { color: '#374151', fontSize: 13 },
  error:        { color: '#ef4444', fontSize: 12, paddingHorizontal: 16, paddingBottom: 4 },
  inputRow:     { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  input:        { flex: 1, borderRadius: 20, borderWidth: 1, borderColor: '#d1d5db', paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendBtn:      { backgroundColor: '#6366f1', borderRadius: 20, paddingHorizontal: 18, justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText:  { color: '#fff', fontWeight: '600' },
});
