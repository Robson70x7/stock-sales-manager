import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/use-colors';
import { useState, useMemo } from 'react';
import { formatDateISO } from '@shared/lib/utils';

interface DatePickerFieldProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
}

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

export function DatePickerField({ label, value, onChange, placeholder }: DatePickerFieldProps) {
  const colors = useColors();
  const [showPicker, setShowPicker] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState(() => {
    if (value) {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date();
  });

  const [displayMonth, setDisplayMonth] = useState(selectedDate.getMonth());
  const [displayYear, setDisplayYear] = useState(selectedDate.getFullYear());

  const daysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const firstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    const firstDay = firstDayOfMonth(displayYear, displayMonth);
    const daysCount = daysInMonth(displayYear, displayMonth);

    // Preencher dias do mês anterior
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Preencher dias do mês atual
    for (let i = 1; i <= daysCount; i++) {
      days.push(i);
    }

    return days;
  }, [displayYear, displayMonth]);

  const handleSelectDay = (day: number) => {
    const dateStr = formatDateISO(displayYear, displayMonth, day);
    onChange(dateStr);
    setSelectedDate(new Date(displayYear, displayMonth, day));
    setShowPicker(false);
  };

  const handlePrevMonth = () => {
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear(displayYear - 1);
    } else {
      setDisplayMonth(displayMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (displayMonth === 11) {
      setDisplayMonth(0);
      setDisplayYear(displayYear + 1);
    } else {
      setDisplayMonth(displayMonth + 1);
    }
  };

  const displayValue = value
    ? (([y, m, d]) => `${d}/${m}/${y}`)(value.split('-'))
    : placeholder || 'Selecione uma data';

  return (
    <>
      <Pressable
        onPress={() => setShowPicker(true)}
        style={({ pressed }) => [
          styles.field,
          { backgroundColor: colors.surface, borderColor: colors.border },
          pressed && { opacity: 0.7 }
        ]}
      >
        <View style={styles.fieldContent}>
          <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
          <View style={styles.inputRow}>
            <Text style={[styles.value, { color: colors.foreground }]}>{displayValue}</Text>
            <MaterialIcons name="calendar-today" size={20} color={colors.primary} />
          </View>
        </View>
      </Pressable>

      <Modal visible={showPicker} transparent animationType="fade" onRequestClose={() => setShowPicker(false)}>
        <Pressable
          style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          onPress={() => setShowPicker(false)}
        >
          <Pressable
            style={[styles.pickerContainer, { backgroundColor: colors.surface }]}
            onPress={e => e.stopPropagation()}
          >
            {/* Header */}
            <View style={[styles.pickerHeader, { backgroundColor: colors.primary }]}>
              <Text style={styles.pickerTitle}>
                {MONTHS_PT[displayMonth]} {displayYear}
              </Text>
            </View>

            {/* Dias da semana */}
            <View style={styles.weekDays}>
              {DAYS_OF_WEEK.map(day => (
                <Text key={day} style={[styles.weekDayLabel, { color: colors.muted }]}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Calendário */}
            <View style={styles.calendar}>
              {Array.from({ length: Math.ceil(calendarDays.length / 7) }).map((_, weekIdx) => (
                <View key={weekIdx} style={styles.week}>
                  {calendarDays.slice(weekIdx * 7, (weekIdx + 1) * 7).map((day, dayIdx) => (
                    <Pressable
                      key={dayIdx}
                      onPress={() => day && handleSelectDay(day)}
                      style={({ pressed }) => [
                        styles.dayButton,
                        !day ? styles.emptyDay : {},
                        day === selectedDate.getDate() &&
                          displayMonth === selectedDate.getMonth() &&
                          displayYear === selectedDate.getFullYear() && {
                            backgroundColor: colors.primary,
                          },
                        pressed && day ? { opacity: 0.7 } : {},
                      ]}
                      disabled={!day}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          {
                            color:
                              day === selectedDate.getDate() &&
                              displayMonth === selectedDate.getMonth() &&
                              displayYear === selectedDate.getFullYear()
                                ? '#fff'
                                : colors.foreground,
                          },
                        ]}
                      >
                        {day}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>

            {/* Navegação */}
            <View style={[styles.pickerFooter, { borderTopColor: colors.border }]}>
              <Pressable
                onPress={handlePrevMonth}
                style={({ pressed }) => [styles.navButton, pressed && { opacity: 0.6 }]}
              >
                <MaterialIcons name="chevron-left" size={24} color={colors.primary} />
              </Pressable>

              <Pressable
                onPress={() => setShowPicker(false)}
                style={[styles.confirmButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.confirmText}>Confirmar</Text>
              </Pressable>

              <Pressable
                onPress={handleNextMonth}
                style={({ pressed }) => [styles.navButton, pressed && { opacity: 0.6 }]}
              >
                <MaterialIcons name="chevron-right" size={24} color={colors.primary} />
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  fieldContent: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    width: '90%',
    maxWidth: 350,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pickerHeader: {
    padding: 16,
    alignItems: 'center',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  weekDays: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  weekDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  calendar: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  week: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayButton: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    marginHorizontal: 2,
  },
  emptyDay: {
    opacity: 0,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pickerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  navButton: {
    padding: 8,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
