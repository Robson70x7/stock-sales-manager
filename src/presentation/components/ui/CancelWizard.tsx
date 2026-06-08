import { useState, useCallback } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Switch, TextInput } from 'react-native';
import { useColors } from '@/hooks/use-colors';
import { formatCurrency } from '@shared/lib/utils';

interface CancelWizardProps {
  visible: boolean;
  sale: {
    totalAmount: number;
    items: { productName: string; quantity: number; totalPrice: number; profitAmount?: number | null }[];
    installments: { status: string; amount: number }[];
  };
  onConfirm: (params: { refundAmount: number | null; returnProductsWithClient: boolean }) => void;
  onCancel: () => void;
}

export function CancelWizard({ visible, sale, onConfirm, onCancel }: CancelWizardProps) {
  const colors = useColors();
  const [step, setStep] = useState(1);
  const [refundMode, setRefundMode] = useState<'full' | 'partial' | 'none'>('full');
  const [partialRefund, setPartialRefund] = useState('');
  const [returnProducts, setReturnProducts] = useState(true);
  const [acknowledgedWarning, setAcknowledgedWarning] = useState(false);

  const paidAmount = sale.installments.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
  const refundAmount = refundMode === 'full' ? paidAmount : refundMode === 'partial' ? (Number(partialRefund) || 0) : 0;
  const totalCost = sale.items.reduce((sum, i) => sum + (i.profitAmount != null ? (i.totalPrice - i.profitAmount) : 0), 0);
  const lossEstimate = returnProducts
    ? paidAmount - refundAmount
    : paidAmount - refundAmount - totalCost;

  const reset = useCallback(() => {
    setStep(1);
    setRefundMode('full');
    setPartialRefund('');
    setReturnProducts(true);
    setAcknowledgedWarning(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onCancel();
  }, [reset, onCancel]);

  const handleNext = useCallback(() => {
    if (step === 1) {
      if (!returnProducts) {
        setStep(2);
      } else {
        setStep(3);
      }
    } else if (step === 2) {
      if (acknowledgedWarning) {
        setStep(3);
      }
    } else if (step === 3) {
      onConfirm({ refundAmount: refundMode === 'none' ? null : refundAmount, returnProductsWithClient: returnProducts });
      reset();
    }
  }, [step, returnProducts, acknowledgedWarning, refundMode, refundAmount, onConfirm, reset]);

  const handleBack = useCallback(() => {
    if (step === 2) setStep(1);
    else if (step === 3) {
      setStep(returnProducts ? 1 : 2);
    }
  }, [step, returnProducts]);

  const stepCount = returnProducts ? 2 : 3;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <View style={[styles.dialog, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>Cancelar Venda</Text>
            <View style={styles.stepIndicator}>
              {Array.from({ length: stepCount }, (_, i) => (
                <View
                  key={i}
                  style={[
                    styles.stepDot,
                    { backgroundColor: i + 1 === step ? colors.primary : i + 1 < step ? '#16A34A' : colors.border },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Step 1: Refund */}
          {step === 1 && (
            <View>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>Valor do Reembolso</Text>
              <Text style={[styles.message, { color: colors.muted }]}>
                Total recebido: {formatCurrency(paidAmount)}
              </Text>

              <Pressable
                onPress={() => setRefundMode('full')}
                style={[styles.option, { borderColor: refundMode === 'full' ? colors.primary : colors.border }]}
              >
                <Text style={[styles.optionLabel, { color: colors.foreground }]}>Reembolso total ({formatCurrency(paidAmount)})</Text>
              </Pressable>

              <Pressable
                onPress={() => setRefundMode('none')}
                style={[styles.option, { borderColor: refundMode === 'none' ? colors.primary : colors.border }]}
              >
                <Text style={[styles.optionLabel, { color: colors.foreground }]}>Sem reembolso</Text>
              </Pressable>

              <Pressable
                onPress={() => setRefundMode('partial')}
                style={[styles.option, { borderColor: refundMode === 'partial' ? colors.primary : colors.border }]}
              >
                <Text style={[styles.optionLabel, { color: colors.foreground }]}>Reembolso parcial</Text>
              </Pressable>

              {refundMode === 'partial' && (
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                  value={partialRefund}
                  onChangeText={setPartialRefund}
                  keyboardType="decimal-pad"
                  placeholder="Valor do reembolso"
                  placeholderTextColor={colors.muted}
                />
              )}

              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: colors.foreground }]}>Reaver produtos que estão com o cliente</Text>
                <Switch
                  value={returnProducts}
                  onValueChange={setReturnProducts}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          )}

          {/* Step 2: Warning - products not returned */}
          {step === 2 && (
            <View>
              <Text style={[styles.stepTitle, { color: '#DC2626' }]}>Produtos não devolvidos</Text>
              <Text style={[styles.message, { color: colors.muted }]}>
                O cliente ficará com os produtos sem pagamento. Esta ação pode gerar prejuízo e deve ser usada apenas em caso de acordo entre as partes.
              </Text>

              <View style={[styles.warningBox, { backgroundColor: '#7f1d1d', borderColor: '#ef4444' }]}>
                <Text style={{ color: '#fca5a5', fontSize: 13 }}>
                  Estimar prejuízo: {formatCurrency(totalCost)}
                </Text>
                <Text style={{ color: '#fca5a5', fontSize: 13, marginTop: 4 }}>
                  Valor já recebido: {formatCurrency(paidAmount)}
                </Text>
                <Text style={{ color: '#fca5a5', fontSize: 13, fontWeight: '700', marginTop: 4 }}>
                  Saldo: {lossEstimate >= 0 ? formatCurrency(lossEstimate) : `-${formatCurrency(Math.abs(lossEstimate))}`}
                </Text>
              </View>

              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: colors.foreground }]}>
                  Sim, entendi e desejo continuar
                </Text>
                <Switch
                  value={acknowledgedWarning}
                  onValueChange={setAcknowledgedWarning}
                  trackColor={{ false: colors.border, true: '#DC2626' }}
                  thumbColor="#fff"
                />
              </View>
            </View>
          )}

          {/* Step 3: Final confirmation */}
          {step === 3 && (
            <View>
              <Text style={[styles.stepTitle, { color: colors.foreground }]}>Confirmar Cancelamento</Text>
              <Text style={[styles.message, { color: colors.muted }]}>Revise os dados antes de confirmar:</Text>
              <View style={[styles.summaryBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={[styles.summaryItem, { color: colors.foreground }]}>
                  Reembolso: {refundMode === 'none' ? 'Nenhum' : formatCurrency(refundAmount)}
                </Text>
                <Text style={[styles.summaryItem, { color: colors.foreground }]}>
                  Reaver produtos: {returnProducts ? 'Sim' : 'Não'}
                </Text>
                <Text style={[styles.summaryItem, { color: colors.foreground }]}>
                  Parcelas pendentes serão canceladas automaticamente
                </Text>
              </View>
              {lossEstimate < 0 && (
                <Text style={{ color: '#D97706', fontSize: 13, textAlign: 'center', marginTop: 8 }}>
                  Prejuízo estimado: {formatCurrency(Math.abs(lossEstimate))}
                </Text>
              )}
            </View>
          )}

          {/* Actions */}
          <View style={styles.buttons}>
            {step > 1 ? (
              <Pressable
                onPress={handleBack}
                style={({ pressed }) => [
                  styles.btn,
                  { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.cancelText, { color: colors.muted }]}>Voltar</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleClose}
                style={({ pressed }) => [
                  styles.btn,
                  { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.cancelText, { color: colors.muted }]}>Cancelar</Text>
              </Pressable>
            )}
            <Pressable
              onPress={handleNext}
              style={({ pressed }) => [
                styles.btn,
                {
                  backgroundColor:
                    (step === 2 && !acknowledgedWarning) || (refundMode === 'partial' && !partialRefund)
                      ? colors.border : step === 3 ? '#DC2626' : colors.primary,
                },
                pressed && { opacity: 0.7 },
              ]}
              disabled={(step === 2 && !acknowledgedWarning) || (refundMode === 'partial' && !partialRefund)}
            >
              <Text style={[styles.confirmText, { color: '#fff' }]}>
                {step === 3 ? 'Confirmar' : 'Próximo'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700' },
  stepIndicator: { flexDirection: 'row', gap: 6 },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
  stepTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  message: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  option: {
    borderRadius: 10,
    borderWidth: 1.5,
    padding: 12,
    marginBottom: 8,
  },
  optionLabel: { fontSize: 14, fontWeight: '500' },
  input: { borderRadius: 10, borderWidth: 1, padding: 12, fontSize: 14, marginBottom: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, paddingVertical: 8 },
  switchLabel: { fontSize: 14, flex: 1, marginRight: 12 },
  warningBox: { borderRadius: 10, padding: 12, borderWidth: 1, marginBottom: 12 },
  summaryBox: { borderRadius: 10, padding: 12, borderWidth: 1, gap: 8 },
  summaryItem: { fontSize: 14 },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  confirmText: { fontSize: 14, fontWeight: '600', color: '#fff', textAlign: 'center' },
});
