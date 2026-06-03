import { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { getDb } from '@infra/database/db';

const DANGEROUS_KEYWORDS = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'REINDEX', 'REPLACE', 'TRUNCATE', 'VACUUM'];
const HEAVY_COLUMNS = new Set(['photoUri', 'photo', 'image', 'imageUri']);

function isReadOnlyQuery(sql: string): boolean {
  const trimmed = sql.trim().toUpperCase();
  return !DANGEROUS_KEYWORDS.some(kw => trimmed.startsWith(kw));
}

function stripHeavyColumns(rows: any[]): any[] {
  return rows.map(row => {
    if (!row || typeof row !== 'object') return row;
    const cleaned: Record<string, any> = {};
    for (const key of Object.keys(row)) {
      if (!HEAVY_COLUMNS.has(key)) {
        cleaned[key] = row[key];
      }
    }
    return cleaned;
  });
}

function formatResult(data: any): string {
  if (data === undefined || data === null) return 'OK';
  return JSON.stringify(data, null, 2);
}

export function SqlConsole({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const [sql, setSql] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const inputRef = useRef<TextInput>(null);
  

  const handleRun = async () => {
    if (!sql.trim()) return;

    if (!isReadOnlyQuery(sql)) {
      Alert.alert(
        'Confirmar',
        'Esta query pode modificar dados. Deseja continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Executar', style: 'destructive', onPress: () => executeSql(sql) },
        ]
      );
      return;
    }

    await executeSql(sql);
  };

  const executeSql = async (query: string) => {
    setError(null);
    setResult(null);
    setRunning(true);

    try {
      const db = await getDb();

      if (isReadOnlyQuery(query)) {
        const rows = await db.getAllAsync(query);
        const cleaned = stripHeavyColumns(rows);
        const label = cleaned.length === 0
          ? '(0 linhas)\n\n'
          : `(${cleaned.length} ${cleaned.length === 1 ? 'linha' : 'linhas'})\n\n`;
        setResult(label + formatResult(cleaned));
      } else {
        const res = await db.runAsync(query);
        setResult(formatResult({
          changes: res.changes,
          lastInsertRowId: res.lastInsertRowId,
        }));
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setRunning(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>SQL Console</Text>
          <View style={styles.headerRight}>
            <Text style={[styles.devBadge, { color: colors.muted }]}>DEV</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={22} color={colors.foreground} />
            </Pressable>
          </View>
        </View>

        <View style={styles.body}>
          <View style={[styles.inputCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TextInput
              ref={inputRef}
              value={sql}
              onChangeText={setSql}
              placeholder="Digite uma query SQL..."
              placeholderTextColor={colors.muted}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, { color: colors.foreground }]}
            />
            <Pressable
              onPress={handleRun}
              disabled={running || !sql.trim()}
              style={[styles.runBtn, { backgroundColor: colors.primary, opacity: running || !sql.trim() ? 0.6 : 1 }]}
            >
              {running ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialIcons name="play-arrow" size={20} color="#fff" />
              )}
              <Text style={styles.runBtnText}>{running ? 'Executando...' : 'Executar'}</Text>
            </Pressable>
          </View>

          {error && (
            <View style={[styles.resultCard, { backgroundColor: '#450A0A', borderColor: '#DC2626' }]}>
              <View style={styles.resultHeader}>
                <MaterialIcons name="error" size={16} color="#DC2626" />
                <Text style={[styles.resultLabel, { color: '#FCA5A5' }]}>Erro</Text>
              </View>
              <Text style={[styles.errorText, { color: '#FCA5A5' }]}>{error}</Text>
            </View>
          )}

          {result !== null && !error && (
            <View style={[styles.resultCard, { backgroundColor: '#0C1F11', borderColor: '#16A34A' }]}>
              <View style={styles.resultHeader}>
                <MaterialIcons name="check-circle" size={16} color="#16A34A" />
                <Text style={[styles.resultLabel, { color: '#86EFAC' }]}>Resultado</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator>
                <Text style={[styles.resultText, { color: '#D1FAE5' }]} selectable>
                  {result}
                </Text>
              </ScrollView>
            </View>
          )}

          {!result && !error && (
            <View style={[styles.helpCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <MaterialIcons name="info" size={16} color={colors.muted} />
              <Text style={[styles.helpText, { color: colors.muted }]}>
                Digite uma query SQL e clique em Executar.{'\n'}
                SELECT → JSON array{'\n'}
                INSERT/UPDATE/DELETE → {`{ "changes": N }`}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    paddingTop: 50,
  },
  title: { fontSize: 18, fontWeight: '700' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  devBadge: { fontSize: 11, fontWeight: '700', backgroundColor: '#DC2626', color: '#fff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  closeBtn: { padding: 4 },
  body: { flex: 1, padding: 16, gap: 12 },
  inputCard: { borderRadius: 12, borderWidth: 0.5, overflow: 'hidden' },
  input: { fontSize: 14, fontFamily: 'monospace', padding: 14, minHeight: 100, lineHeight: 20 },
  runBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, marginHorizontal: 14, marginBottom: 14, borderRadius: 8 },
  runBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  resultCard: { borderRadius: 12, borderWidth: 1, padding: 14 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  resultLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  errorText: { fontSize: 13, fontFamily: 'monospace', lineHeight: 18 },
  resultText: { fontSize: 12, fontFamily: 'monospace', lineHeight: 18 },
  helpCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 14, borderRadius: 12, borderWidth: 0.5 },
  helpText: { fontSize: 13, flex: 1, lineHeight: 18 },
});
