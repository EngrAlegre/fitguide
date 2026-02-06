import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';
import { ActivityType } from '../types/activity';
import { calculateCalories, getActivityTypes } from '../utils/calorieCalculator';

interface LogActivityModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (type: ActivityType, duration: number, intensity: number, calories: number) => void;
}

export default function LogActivityModal({ visible, onClose, onSave }: LogActivityModalProps) {
  const [selectedType, setSelectedType] = useState<ActivityType | null>(null);
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [showDropdown, setShowDropdown] = useState(false);

  const activityTypes = getActivityTypes();

  const estimatedCalories =
    selectedType && duration
      ? calculateCalories(selectedType, parseInt(duration, 10) || 0, intensity)
      : 0;

  useEffect(() => {
    if (!visible) {
      // Reset form when modal closes
      setSelectedType(null);
      setDuration('');
      setIntensity(5);
      setShowDropdown(false);
    }
  }, [visible]);

  const handleSave = () => {
    if (!selectedType || !duration || parseInt(duration, 10) <= 0) {
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    onSave(selectedType, parseInt(duration, 10), intensity, estimatedCalories);
    onClose();
  };

  const handleIntensityChange = (value: number) => {
    setIntensity(value);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>LOG ACTIVITY</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Activity Type */}
            <Text style={styles.label}>ACTIVITY TYPE</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowDropdown(!showDropdown)}
            >
              <Text style={selectedType ? styles.dropdownText : styles.dropdownPlaceholder}>
                {selectedType || 'Select Activity'}
              </Text>
              <Ionicons
                name={showDropdown ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
            {showDropdown && (
              <View style={styles.dropdownList}>
                {activityTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSelectedType(type);
                      setShowDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <Text style={styles.hint}>(e.g., Running, Cycling)</Text>

            {/* Duration */}
            <Text style={[styles.label, { marginTop: Spacing.lg }]}>DURATION (MINUTES)</Text>
            <TextInput
              style={styles.input}
              value={duration}
              onChangeText={setDuration}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={Colors.textSecondary}
            />

            {/* Intensity */}
            <Text style={[styles.label, { marginTop: Spacing.lg }]}>INTENSITY</Text>
            <View style={styles.intensityContainer}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.intensityButton,
                    level <= intensity && styles.intensityButtonActive,
                  ]}
                  onPress={() => handleIntensityChange(level)}
                >
                  <Text
                    style={[
                      styles.intensityText,
                      level <= intensity && styles.intensityTextActive,
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Estimated Calories */}
            <View style={styles.estimateContainer}>
              <Text style={styles.estimateLabel}>ESTIMATED BURN:</Text>
              <Text style={styles.estimateValue}>{estimatedCalories} CALS</Text>
            </View>
          </ScrollView>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!selectedType || !duration || parseInt(duration, 10) <= 0) &&
                styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!selectedType || !duration || parseInt(duration, 10) <= 0}
          >
            <Text style={styles.saveButtonText}>SAVE ACTIVITY</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: '85%',
    paddingTop: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 20,
    color: Colors.textPrimary,
    ...Fonts.heading,
    letterSpacing: 1,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    ...Fonts.data,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  dropdown: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.textPrimary,
    ...Fonts.body,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: Colors.textSecondary,
    ...Fonts.body,
  },
  dropdownList: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItemText: {
    fontSize: 16,
    color: Colors.textPrimary,
    ...Fonts.body,
  },
  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
    ...Fonts.body,
    marginTop: Spacing.xs,
  },
  input: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.textPrimary,
    ...Fonts.body,
  },
  intensityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  intensityButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  intensityButtonActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  intensityText: {
    fontSize: 16,
    color: Colors.textSecondary,
    ...Fonts.data,
  },
  intensityTextActive: {
    color: Colors.background,
    ...Fonts.heading,
  },
  estimateContainer: {
    backgroundColor: Colors.cardBg,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  estimateLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    ...Fonts.data,
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  estimateValue: {
    fontSize: 32,
    color: Colors.accent,
    ...Fonts.heading,
  },
  saveButton: {
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
    padding: Spacing.md,
    margin: Spacing.lg,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: Colors.cardBg,
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    color: Colors.background,
    ...Fonts.heading,
    letterSpacing: 1,
  },
});
