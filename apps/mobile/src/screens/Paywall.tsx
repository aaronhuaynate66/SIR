import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { type PurchasesPackage } from 'react-native-purchases';
import { usePurchases } from '../hooks/usePurchases';

const FEATURES = [
  '✦ Grafo de relaciones ilimitado',
  '✦ Briefing ejecutivo semanal',
  '✦ Análisis de señales avanzado',
  '✦ Exportación de datos completa',
  '✦ Soporte prioritario',
];

interface Props {
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function Paywall({ onClose, onSuccess }: Props) {
  const { isPro, loading, packages, purchase, restore } = usePurchases();
  const [busy, setBusy] = useState(false);

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setBusy(true);
    const ok = await purchase(pkg);
    setBusy(false);
    if (ok) {
      Alert.alert('¡Bienvenido a SIR Pro!', 'Tu suscripción está activa.');
      onSuccess?.();
    } else {
      Alert.alert('Error', 'No se pudo completar la compra. Inténtalo de nuevo.');
    }
  };

  const handleRestore = async () => {
    setBusy(true);
    const ok = await restore();
    setBusy(false);
    if (ok) {
      Alert.alert('Restaurado', 'Tu suscripción Pro está activa.');
      onSuccess?.();
    } else {
      Alert.alert('Sin compras previas', 'No encontramos una suscripción activa.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6366f1" size="large" />
      </View>
    );
  }

  if (isPro) {
    return (
      <View style={styles.center}>
        <Text style={styles.proBadge}>✓ Ya tienes SIR Pro</Text>
        {onClose && (
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeTxt}>Cerrar</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>SIR Pro</Text>
      <Text style={styles.subtitle}>Inteligencia relacional sin límites</Text>

      <View style={styles.featureBox}>
        {FEATURES.map((f) => (
          <Text key={f} style={styles.feature}>{f}</Text>
        ))}
      </View>

      {packages.length === 0 ? (
        <Text style={styles.unavailable}>Suscripciones no disponibles en este momento.</Text>
      ) : (
        packages.map((pkg) => (
          <Pressable
            key={pkg.identifier}
            style={[styles.buyBtn, busy && styles.disabled]}
            onPress={() => handlePurchase(pkg)}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buyTitle}>{pkg.product.title}</Text>
                <Text style={styles.buyPrice}>{pkg.product.priceString} / mes</Text>
              </>
            )}
          </Pressable>
        ))
      )}

      <Pressable onPress={handleRestore} disabled={busy} style={styles.restoreBtn}>
        <Text style={styles.restoreTxt}>Restaurar compra</Text>
      </Pressable>

      {onClose && (
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeTxt}>No por ahora</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:   { padding: 24, alignItems: 'center', paddingBottom: 48 },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title:       { fontSize: 34, fontWeight: '800', color: '#e2e8f0', marginBottom: 6 },
  subtitle:    { fontSize: 15, color: '#94a3b8', marginBottom: 32, textAlign: 'center' },
  featureBox:  { width: '100%', backgroundColor: '#1a1d27', borderRadius: 14, padding: 18, marginBottom: 28 },
  feature:     { color: '#e2e8f0', fontSize: 14, marginBottom: 10, lineHeight: 20 },
  buyBtn:      { width: '100%', backgroundColor: '#6366f1', borderRadius: 12, padding: 18, alignItems: 'center', marginBottom: 12 },
  disabled:    { opacity: 0.6 },
  buyTitle:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  buyPrice:    { color: '#c7d2fe', fontSize: 13, marginTop: 2 },
  restoreBtn:  { marginTop: 8, padding: 12 },
  restoreTxt:  { color: '#6366f1', fontSize: 13 },
  closeBtn:    { marginTop: 12, padding: 12 },
  closeTxt:    { color: '#64748b', fontSize: 13 },
  proBadge:    { fontSize: 18, color: '#34d399', fontWeight: '700', marginBottom: 20 },
  unavailable: { color: '#64748b', fontSize: 13, textAlign: 'center' },
});
