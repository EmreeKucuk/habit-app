import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Typography from '@/components/ui/Typography';
import { useTheme } from '@/context/ThemeContext';
import { Spacing, Radius, Shadows, FontFamily, FontSize } from '@/constants/theme';

interface CreateHabitModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (habitData: {
    name: string;
    category: string;
    frequency: string;
    frequency_count: number;
  }) => void;
}

const CATEGORIES = [
  { id: 'health', label: 'Health', icon: 'heart-outline' },
  { id: 'sport', label: 'Sport', icon: 'fitness-outline' },
  { id: 'learning', label: 'Learning', icon: 'book-outline' },
  { id: 'productivity', label: 'Productivity', icon: 'flash-outline' },
  { id: 'mindfulness', label: 'Mindfulness', icon: 'leaf-outline' },
  { id: 'social', label: 'Social', icon: 'people-outline' },
  { id: 'other', label: 'Other', icon: 'star-outline' },
];

const FREQUENCIES = [
  { id: 'daily', label: 'Daily', desc: 'Every day' },
  { id: 'interval', label: 'Interval', desc: 'Every X days' },
  { id: 'flexible_weekly', label: 'Flexible', desc: 'X times a week' },
];

export default function CreateHabitModal({ visible, onClose, onSubmit }: CreateHabitModalProps) {
  const { Colors } = useTheme();
  const styles = React.useMemo(() => createStyles(Colors), [Colors]);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('health');
  const [frequency, setFrequency] = useState('daily');
  const [frequencyCount, setFrequencyCount] = useState('1');
  const [error, setError] = useState('');

  const handleClose = () => {
    // Reset form
    setName('');
    setCategory('health');
    setFrequency('daily');
    setFrequencyCount('1');
    setError('');
    onClose();
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Please enter a habit name.');
      return;
    }

    const count = parseInt(frequencyCount, 10);
    if (frequency !== 'daily') {
      if (isNaN(count) || count < 1) {
        setError('Please enter a valid number for frequency.');
        return;
      }
      if (frequency === 'flexible_weekly' && count > 7) {
        setError('Cannot exceed 7 times a week.');
        return;
      }
    }

    onSubmit({
      name: name.trim(),
      category,
      frequency,
      frequency_count: frequency === 'daily' ? 1 : count,
    });
    handleClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Typography variant="h3">Create New Habit</Typography>
              <Pressable onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              
              {error ? (
                <View style={styles.errorBox}>
                  <Typography variant="caption" color={Colors.error}>{error}</Typography>
                </View>
              ) : null}

              {/* Name Input */}
              <View style={styles.inputGroup}>
                <Typography variant="bodySmall" color={Colors.textMuted} style={styles.label}>
                  Habit Name
                </Typography>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Read 10 pages"
                  placeholderTextColor={Colors.textMuted}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    setError('');
                  }}
                  autoFocus
                />
              </View>

              {/* Category Selection */}
              <View style={styles.inputGroup}>
                <Typography variant="bodySmall" color={Colors.textMuted} style={styles.label}>
                  Category
                </Typography>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                  {CATEGORIES.map((cat) => {
                    const isSelected = category === cat.id;
                    return (
                      <Pressable
                        key={cat.id}
                        style={[styles.chip, isSelected && styles.chipActive]}
                        onPress={() => setCategory(cat.id)}
                      >
                        <Ionicons 
                          name={cat.icon as any} 
                          size={16} 
                          color={isSelected ? Colors.white : Colors.text} 
                          style={{ marginRight: 6 }} 
                        />
                        <Typography variant="caption" color={isSelected ? Colors.white : Colors.text}>
                          {cat.label}
                        </Typography>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Frequency Selection */}
              <View style={styles.inputGroup}>
                <Typography variant="bodySmall" color={Colors.textMuted} style={styles.label}>
                  Frequency
                </Typography>
                <View style={styles.frequencyRow}>
                  {FREQUENCIES.map((freq) => {
                    const isSelected = frequency === freq.id;
                    return (
                      <Pressable
                        key={freq.id}
                        style={[styles.freqCard, isSelected && styles.freqCardActive]}
                        onPress={() => {
                          setFrequency(freq.id);
                          if (freq.id === 'daily') setFrequencyCount('1');
                          else if (freq.id === 'flexible_weekly' && parseInt(frequencyCount) > 7) setFrequencyCount('7');
                        }}
                      >
                        <Typography variant="bodySmall" style={isSelected && { color: Colors.white, fontFamily: FontFamily.semiBold }}>
                          {freq.label}
                        </Typography>
                        <Typography variant="caption" color={isSelected ? 'rgba(255,255,255,0.8)' : Colors.textLight}>
                          {freq.desc}
                        </Typography>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Dynamic Frequency Count Input */}
              {frequency !== 'daily' && (
                <View style={styles.inputGroup}>
                  <Typography variant="bodySmall" color={Colors.textMuted} style={styles.label}>
                    {frequency === 'interval' ? 'Every how many days?' : 'How many times per week?'}
                  </Typography>
                  <View style={styles.counterRow}>
                    <Pressable
                      style={styles.counterBtn}
                      onPress={() => setFrequencyCount(String(Math.max(1, parseInt(frequencyCount) - 1)))}
                    >
                      <Ionicons name="remove" size={20} color={Colors.text} />
                    </Pressable>
                    
                    <TextInput
                      style={styles.counterInput}
                      keyboardType="numeric"
                      value={frequencyCount}
                      onChangeText={(text) => {
                        const num = text.replace(/[^0-9]/g, '');
                        if (frequency === 'flexible_weekly' && parseInt(num) > 7) {
                          setFrequencyCount('7');
                        } else {
                          setFrequencyCount(num);
                        }
                      }}
                      maxLength={3}
                    />

                    <Pressable
                      style={styles.counterBtn}
                      onPress={() => {
                        const next = parseInt(frequencyCount) + 1;
                        if (frequency === 'flexible_weekly' && next > 7) return;
                        setFrequencyCount(String(next));
                      }}
                    >
                      <Ionicons name="add" size={20} color={Colors.text} />
                    </Pressable>
                  </View>
                  <Typography variant="caption" color={Colors.textLight} style={{ marginTop: 8 }}>
                    {frequency === 'interval' 
                      ? `You must complete this habit at least once every ${frequencyCount || 'X'} days.`
                      : `You must complete this habit ${frequencyCount || 'X'} times between Monday and Sunday.`
                    }
                  </Typography>
                </View>
              )}

            </ScrollView>

            <Pressable style={styles.submitButton} onPress={handleSubmit}>
              <Typography variant="h3" color={Colors.white}>Create Habit</Typography>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const createStyles = (Colors: any) => StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
  },
  modalCard: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    padding: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    maxHeight: '90%',
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  closeButton: {
    padding: 4,
    backgroundColor: Colors.cardLight,
    borderRadius: Radius.full,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  errorBox: {
    backgroundColor: Colors.error + '20',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  label: {
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: Colors.cardLight,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipRow: {
    gap: Spacing.sm,
    paddingRight: Spacing.xl,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  freqCard: {
    flex: 1,
    backgroundColor: Colors.cardLight,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  freqCardActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardLight,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xs,
  },
  counterBtn: {
    padding: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
  },
  counterInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: Colors.text,
  },
  submitButton: {
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
});
