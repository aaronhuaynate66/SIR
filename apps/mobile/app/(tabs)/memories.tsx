import { View, Text, StyleSheet, ScrollView } from 'react-native';

const LAYERS = [
  { name: 'Sensory',    desc: 'Buffer 30s — inputs crudos',      color: '#fef3c7' },
  { name: 'Working',    desc: 'Contexto activo de sesión',        color: '#dbeafe' },
  { name: 'Episodic',   desc: 'Eventos con timestamp',            color: '#dcfce7' },
  { name: 'Semantic',   desc: 'Conocimiento con embeddings',      color: '#ede9fe' },
  { name: 'Procedural', desc: 'Rutinas y workflows',              color: '#fce7f3' },
  { name: 'Emotional',  desc: 'Estados afectivos',                color: '#ffedd5' },
  { name: 'Social',     desc: 'Grafo de relaciones (Neo4j)',       color: '#e0f2fe' },
  { name: 'Prophetic',  desc: 'Predicciones y patrones futuros',  color: '#f0fdf4' },
];

export default function MemoriesScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Capas de Memoria</Text>
      {LAYERS.map((layer, i) => (
        <View key={i} style={[styles.card, { backgroundColor: layer.color }]}>
          <Text style={styles.layerName}>{layer.name}</Text>
          <Text style={styles.layerDesc}>{layer.desc}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content:   { padding: 16, gap: 10 },
  title:     { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  card:      { borderRadius: 12, padding: 16 },
  layerName: { fontSize: 16, fontWeight: '600', color: '#1f2937' },
  layerDesc: { fontSize: 13, color: '#6b7280', marginTop: 2 },
});
