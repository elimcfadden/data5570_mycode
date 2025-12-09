/**
 * WorkoutDayScreen
 * 
 * Displays and allows editing workout entries for a specific date.
 * - Card-based display for strength and cardio entries (non-editable inline)
 * - Modal-based Add/Edit flows for both strength and cardio
 * - Edit and Delete buttons on each card
 * - Immediate save after each action
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput,
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  ScrollView,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { 
  useGetDayWorkoutQuery, 
  useSaveDayWorkoutMutation,
  useGetExercisesQuery,
  useCreateExerciseMutation,
  useGetCardioTypesQuery,
  useCreateCardioTypeMutation,
} from '../store/apiSlice';

// Format minutes to "Xh Ym" format
const formatCardioTime = (minutes) => {
  if (!minutes || minutes === 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export default function WorkoutDayScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  
  // Get date from route params
  const date = route.params?.date || '2025-12-08';

  // Local state for entries
  const [notes, setNotes] = useState('');
  const [entries, setEntries] = useState([]);
  const [cardioEntries, setCardioEntries] = useState([]);
  const [saveMessage, setSaveMessage] = useState(null);
  
  // Refs to track latest state values (avoids stale closure issues in Alert callbacks)
  const entriesRef = useRef(entries);
  const cardioEntriesRef = useRef(cardioEntries);
  const notesRef = useRef(notes);
  
  // Strength Modal State
  const [strengthModalVisible, setStrengthModalVisible] = useState(false);
  const [strengthModalMode, setStrengthModalMode] = useState('add'); // 'add' or 'edit'
  const [editingStrengthIndex, setEditingStrengthIndex] = useState(null);
  const [strengthForm, setStrengthForm] = useState({
    exercise_id: null,
    exercise_name: '',
    muscle_group: '',
    sets: '3',
    reps: '10',
    weight: '0',
  });
  
  // Cardio Modal State
  const [cardioModalVisible, setCardioModalVisible] = useState(false);
  const [cardioModalMode, setCardioModalMode] = useState('add'); // 'add' or 'edit'
  const [editingCardioIndex, setEditingCardioIndex] = useState(null);
  const [cardioForm, setCardioForm] = useState({
    cardio_type_id: null,
    cardio_type_name: '',
    minutes: '30',
    distance: '',
  });
  
  // Exercise picker within strength modal
  const [exercisePickerVisible, setExercisePickerVisible] = useState(false);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState(null);
  
  // Cardio type picker within cardio modal
  const [cardioTypePickerVisible, setCardioTypePickerVisible] = useState(false);
  
  // New exercise modal state
  const [newExerciseModalVisible, setNewExerciseModalVisible] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscleGroup, setNewExerciseMuscleGroup] = useState('');
  
  // New cardio type modal state
  const [newCardioTypeModalVisible, setNewCardioTypeModalVisible] = useState(false);
  const [newCardioTypeName, setNewCardioTypeName] = useState('');

  // Fetch workout data
  const { 
    data: workoutData, 
    error: workoutError, 
    isLoading: workoutLoading,
    isFetching: workoutFetching,
  } = useGetDayWorkoutQuery(date);

  // Fetch exercises for picker
  const { 
    data: exercisesData,
    isLoading: exercisesLoading,
  } = useGetExercisesQuery();

  // Fetch cardio types for picker
  const { 
    data: cardioTypesData,
    isLoading: cardioTypesLoading,
  } = useGetCardioTypesQuery();

  // Mutations
  const [saveDayWorkout, { isLoading: isSaving }] = useSaveDayWorkoutMutation();
  const [createExercise, { isLoading: isCreatingExercise }] = useCreateExerciseMutation();
  const [createCardioType, { isLoading: isCreatingCardioType }] = useCreateCardioTypeMutation();

  // Initialize local state when data loads
  useEffect(() => {
    if (workoutData) {
      setNotes(workoutData.notes || '');
      setEntries(
        workoutData.entries?.map(e => ({
          id: e.id,
          exercise_id: e.exercise_id,
          exercise_name: e.exercise_name,
          muscle_group: e.muscle_group,
          sets: String(e.sets),
          reps: String(e.reps),
          weight: String(e.weight),
        })) || []
      );
      setCardioEntries(
        workoutData.cardio_entries?.map(c => ({
          id: c.id,
          cardio_type_id: c.cardio_type?.id || c.cardio_type_id,
          cardio_type_name: c.cardio_type?.name || c.cardio_type_name,
          minutes: String(c.minutes),
          distance: c.distance ? String(c.distance) : '',
        })) || []
      );
    }
  }, [workoutData]);

  // Keep refs in sync with state (to avoid stale closures in Alert callbacks)
  useEffect(() => {
    entriesRef.current = entries;
  }, [entries]);

  useEffect(() => {
    cardioEntriesRef.current = cardioEntries;
  }, [cardioEntries]);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // Derive muscle groups from exercises
  const muscleGroups = useMemo(() => {
    if (!exercisesData) return [];
    const groups = [...new Set(exercisesData.map(e => e.muscle_group))];
    return groups.sort();
  }, [exercisesData]);

  // Filter exercises by selected muscle group
  const filteredExercises = useMemo(() => {
    if (!exercisesData) return [];
    if (!selectedMuscleGroup) return exercisesData;
    return exercisesData.filter(e => e.muscle_group === selectedMuscleGroup);
  }, [exercisesData, selectedMuscleGroup]);

  // Calculate local totals
  const localTotalWeight = useMemo(() => {
    return entries.reduce((sum, entry) => {
      const sets = parseInt(entry.sets) || 0;
      const reps = parseInt(entry.reps) || 0;
      const weight = parseFloat(entry.weight) || 0;
      return sum + (sets * reps * weight);
    }, 0);
  }, [entries]);

  const localTotalReps = useMemo(() => {
    return entries.reduce((sum, entry) => {
      const sets = parseInt(entry.sets) || 0;
      const reps = parseInt(entry.reps) || 0;
      return sum + (sets * reps);
    }, 0);
  }, [entries]);

  const localTotalCardioMinutes = useMemo(() => {
    return cardioEntries.reduce((sum, entry) => {
      return sum + (parseInt(entry.minutes) || 0);
    }, 0);
  }, [cardioEntries]);

  // Save helper - persists current state to backend
  // Uses refs to get latest notes value to avoid stale closures
  const saveWorkout = async (newEntries, newCardioEntries, showMessage = true) => {
    const validEntries = newEntries.filter(e => e.exercise_id != null);
    const validCardioEntries = newCardioEntries.filter(c => c.cardio_type_id != null);

    const payload = {
      date,
      notes: notesRef.current, // Use ref to get latest notes
      entries: validEntries.map(e => ({
        exercise_id: e.exercise_id,
        sets: Math.max(1, parseInt(e.sets) || 1),
        reps: Math.max(1, parseInt(e.reps) || 1),
        weight: String(parseFloat(e.weight) || 0),
      })),
      cardio_entries: validCardioEntries.map(c => ({
        cardio_type_id: c.cardio_type_id,
        minutes: Math.max(1, parseInt(c.minutes) || 1),
        distance: c.distance ? String(parseFloat(c.distance) || 0) : null,
      })),
    };

    console.log('[SAVE WORKOUT] Payload:', JSON.stringify(payload, null, 2));

    try {
      const result = await saveDayWorkout(payload).unwrap();
      console.log('[SAVE WORKOUT] Success, result:', result);
      if (showMessage) {
        setSaveMessage('✅ Saved!');
        setTimeout(() => setSaveMessage(null), 2000);
      }
      return true;
    } catch (err) {
      console.error('[SAVE WORKOUT] Failed:', err);
      window.alert('Save Failed: ' + (err.data?.error || 'Unknown error occurred'));
      return false;
    }
  };

  // ==================== STRENGTH MODAL HANDLERS ====================

  const openAddStrengthModal = () => {
    setStrengthModalMode('add');
    setEditingStrengthIndex(null);
    setStrengthForm({
      exercise_id: null,
      exercise_name: '',
      muscle_group: '',
      sets: '3',
      reps: '10',
      weight: '0',
    });
    setSelectedMuscleGroup(null);
    setStrengthModalVisible(true);
  };

  const openEditStrengthModal = (index) => {
    const entry = entries[index];
    setStrengthModalMode('edit');
    setEditingStrengthIndex(index);
    setStrengthForm({
      exercise_id: entry.exercise_id,
      exercise_name: entry.exercise_name,
      muscle_group: entry.muscle_group,
      sets: entry.sets,
      reps: entry.reps,
      weight: entry.weight,
    });
    setSelectedMuscleGroup(entry.muscle_group);
    setStrengthModalVisible(true);
  };

  const handleSaveStrength = async () => {
    if (!strengthForm.exercise_id) {
      Alert.alert('Error', 'Please select an exercise.');
      return;
    }

    let newEntries;
    if (strengthModalMode === 'add') {
      newEntries = [...entries, { ...strengthForm }];
    } else {
      newEntries = entries.map((e, i) => 
        i === editingStrengthIndex ? { ...strengthForm } : e
      );
    }

    const success = await saveWorkout(newEntries, cardioEntries);
    if (success) {
      setEntries(newEntries);
      setStrengthModalVisible(false);
    }
  };

  const handleDeleteStrength = async (index) => {
    console.log('[DELETE STRENGTH] Handler called, index:', index, 'total entries:', entries.length);
    
    // Use window.confirm for web compatibility (Alert.alert doesn't work reliably on web)
    const confirmed = window.confirm('Are you sure you want to delete this set?');
    console.log('[DELETE STRENGTH] User confirmed:', confirmed);
    
    if (!confirmed) return;
    
    // Use refs to get latest state values (avoids stale closure)
    const currentEntries = entriesRef.current;
    const currentCardioEntries = cardioEntriesRef.current;
    const newEntries = currentEntries.filter((_, i) => i !== index);
    
    console.log('[DELETE STRENGTH] Before filter:', currentEntries.length, 'After filter:', newEntries.length);
    
    // Update local state immediately (optimistic update)
    setEntries(newEntries);
    
    // Persist to backend
    console.log('[DELETE STRENGTH] Calling saveWorkout...');
    const success = await saveWorkout(newEntries, currentCardioEntries);
    console.log('[DELETE STRENGTH] Save result:', success);
    
    if (!success) {
      // Rollback on failure
      setEntries(currentEntries);
    }
  };

  const handleSelectExercise = (exercise) => {
    setStrengthForm({
      ...strengthForm,
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      muscle_group: exercise.muscle_group,
    });
    setExercisePickerVisible(false);
  };

  // ==================== CARDIO MODAL HANDLERS ====================

  const openAddCardioModal = () => {
    setCardioModalMode('add');
    setEditingCardioIndex(null);
    setCardioForm({
      cardio_type_id: null,
      cardio_type_name: '',
      minutes: '30',
      distance: '',
    });
    setCardioModalVisible(true);
  };

  const openEditCardioModal = (index) => {
    const entry = cardioEntries[index];
    setCardioModalMode('edit');
    setEditingCardioIndex(index);
    setCardioForm({
      cardio_type_id: entry.cardio_type_id,
      cardio_type_name: entry.cardio_type_name,
      minutes: entry.minutes,
      distance: entry.distance || '',
    });
    setCardioModalVisible(true);
  };

  const handleSaveCardio = async () => {
    if (!cardioForm.cardio_type_id) {
      Alert.alert('Error', 'Please select a cardio type.');
      return;
    }

    let newCardioEntries;
    if (cardioModalMode === 'add') {
      newCardioEntries = [...cardioEntries, { ...cardioForm }];
    } else {
      newCardioEntries = cardioEntries.map((c, i) => 
        i === editingCardioIndex ? { ...cardioForm } : c
      );
    }

    const success = await saveWorkout(entries, newCardioEntries);
    if (success) {
      setCardioEntries(newCardioEntries);
      setCardioModalVisible(false);
    }
  };

  const handleDeleteCardio = async (index) => {
    console.log('[DELETE CARDIO] Handler called, index:', index, 'total cardioEntries:', cardioEntries.length);
    
    // Use window.confirm for web compatibility (Alert.alert doesn't work reliably on web)
    const confirmed = window.confirm('Are you sure you want to delete this cardio entry?');
    console.log('[DELETE CARDIO] User confirmed:', confirmed);
    
    if (!confirmed) return;
    
    // Use refs to get latest state values (avoids stale closure)
    const currentEntries = entriesRef.current;
    const currentCardioEntries = cardioEntriesRef.current;
    const newCardioEntries = currentCardioEntries.filter((_, i) => i !== index);
    
    console.log('[DELETE CARDIO] Before filter:', currentCardioEntries.length, 'After filter:', newCardioEntries.length);
    
    // Update local state immediately (optimistic update)
    setCardioEntries(newCardioEntries);
    
    // Persist to backend
    console.log('[DELETE CARDIO] Calling saveWorkout...');
    const success = await saveWorkout(currentEntries, newCardioEntries);
    console.log('[DELETE CARDIO] Save result:', success);
    
    if (!success) {
      // Rollback on failure
      setCardioEntries(currentCardioEntries);
    }
  };

  const handleSelectCardioType = (cardioType) => {
    setCardioForm({
      ...cardioForm,
      cardio_type_id: cardioType.id,
      cardio_type_name: cardioType.name,
    });
    setCardioTypePickerVisible(false);
  };

  // ==================== CREATE NEW EXERCISE/CARDIO TYPE ====================

  const handleCreateExercise = async () => {
    if (!newExerciseName.trim() || !newExerciseMuscleGroup.trim()) {
      Alert.alert('Error', 'Please enter both exercise name and muscle group.');
      return;
    }

    try {
      const result = await createExercise({
        name: newExerciseName.trim(),
        muscle_group: newExerciseMuscleGroup.trim(),
      }).unwrap();
      
      setNewExerciseModalVisible(false);
      setNewExerciseName('');
      setNewExerciseMuscleGroup('');
      
      // Select the newly created exercise
      setStrengthForm({
        ...strengthForm,
        exercise_id: result.id,
        exercise_name: result.name,
        muscle_group: result.muscle_group,
      });
      setSelectedMuscleGroup(result.muscle_group);
    } catch (err) {
      Alert.alert('Error', err.data?.error || 'Failed to create exercise.');
    }
  };

  const handleCreateCardioType = async () => {
    if (!newCardioTypeName.trim()) {
      Alert.alert('Error', 'Please enter a cardio type name.');
      return;
    }

    try {
      const result = await createCardioType({
        name: newCardioTypeName.trim(),
      }).unwrap();
      
      setNewCardioTypeModalVisible(false);
      setNewCardioTypeName('');
      
      // Select the newly created cardio type
      setCardioForm({
        ...cardioForm,
        cardio_type_id: result.id,
        cardio_type_name: result.name,
      });
    } catch (err) {
      Alert.alert('Error', err.data?.error || 'Failed to create cardio type.');
    }
  };

  // ==================== NOTES SAVE ====================

  const handleSaveNotes = async () => {
    await saveWorkout(entries, cardioEntries);
  };

  // ==================== RENDER ====================

  if (workoutLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={styles.loadingText}>Loading workout...</Text>
      </View>
    );
  }

  if (workoutError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading workout</Text>
        <Text style={styles.errorDetail}>
          {JSON.stringify(workoutError.data || workoutError)}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Date Header */}
        <View style={styles.dateHeader}>
          <Text style={styles.dateLabel}>Workout for</Text>
          <Text style={styles.dateValue}>{date}</Text>
          {(workoutFetching || isSaving) && <ActivityIndicator size="small" color="#a855f7" />}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardWeight]}>
            <Text style={styles.statValue}>{localTotalWeight.toFixed(0)}</Text>
            <Text style={styles.statLabel}>lbs lifted</Text>
          </View>
          <View style={[styles.statCard, styles.statCardReps]}>
            <Text style={styles.statValue}>{localTotalReps}</Text>
            <Text style={styles.statLabel}>total reps</Text>
          </View>
          <View style={[styles.statCard, styles.statCardCardio]}>
            <Text style={styles.statValue}>{formatCardioTime(localTotalCardioMinutes)}</Text>
            <Text style={styles.statLabel}>cardio</Text>
          </View>
        </View>

        {/* Notes Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            onBlur={handleSaveNotes}
            placeholder="Add workout notes..."
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Strength Entries Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Strength ({entries.length})</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={openAddStrengthModal}
              disabled={exercisesLoading}
            >
              <Text style={styles.addButtonText}>+ Add Set</Text>
            </TouchableOpacity>
          </View>

          {entries.length === 0 ? (
            <View style={styles.emptyEntries}>
              <Text style={styles.emptyText}>No strength exercises logged</Text>
              <Text style={styles.emptySubtext}>Tap "+ Add Set" to start</Text>
            </View>
          ) : (
            entries.map((entry, index) => (
              <View key={index} style={styles.recordCard}>
                <View style={styles.recordMain}>
                  <View style={styles.recordInfo}>
                    <Text style={styles.recordExercise}>{entry.exercise_name}</Text>
                    <Text style={styles.recordMuscleGroup}>{entry.muscle_group}</Text>
                    <View style={styles.recordStats}>
                      <Text style={styles.recordStatText}>
                        {entry.sets} sets × {entry.reps} reps @ {entry.weight} lbs
                      </Text>
                    </View>
                    <Text style={styles.recordTotal}>
                      = {(
                        (parseInt(entry.sets) || 0) * 
                        (parseInt(entry.reps) || 0) * 
                        (parseFloat(entry.weight) || 0)
                      ).toFixed(0)} lbs total
                    </Text>
                  </View>
                  <View style={styles.recordActions}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => openEditStrengthModal(index)}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteRecordButton}
                      onPress={() => handleDeleteStrength(index)}
                    >
                      <Text style={styles.deleteRecordButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Cardio Entries Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cardio ({cardioEntries.length})</Text>
            <TouchableOpacity 
              style={[styles.addButton, styles.addButtonCardio]}
              onPress={openAddCardioModal}
              disabled={cardioTypesLoading}
            >
              <Text style={styles.addButtonText}>+ Add Cardio</Text>
            </TouchableOpacity>
          </View>

          {cardioEntries.length === 0 ? (
            <View style={styles.emptyEntries}>
              <Text style={styles.emptyText}>No cardio logged</Text>
              <Text style={styles.emptySubtext}>Tap "+ Add Cardio" to start</Text>
            </View>
          ) : (
            cardioEntries.map((entry, index) => (
              <View key={index} style={[styles.recordCard, styles.cardioRecordCard]}>
                <View style={styles.recordMain}>
                  <View style={styles.recordInfo}>
                    <Text style={styles.recordExercise}>{entry.cardio_type_name}</Text>
                    <View style={styles.recordStats}>
                      <Text style={styles.recordStatText}>
                        {formatCardioTime(parseInt(entry.minutes) || 0)}
                        {entry.distance ? ` • ${entry.distance} mi` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.recordActions}>
                    <TouchableOpacity
                      style={[styles.editButton, styles.editButtonCardio]}
                      onPress={() => openEditCardioModal(index)}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteRecordButton}
                      onPress={() => handleDeleteCardio(index)}
                    >
                      <Text style={styles.deleteRecordButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Save Message Toast */}
      {saveMessage && (
        <View style={styles.saveMessage}>
          <Text style={styles.saveMessageText}>{saveMessage}</Text>
        </View>
      )}

      {/* ==================== STRENGTH MODAL ==================== */}
      <Modal
        visible={strengthModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setStrengthModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.formModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.formModalTitle}>
                {strengthModalMode === 'add' ? 'Add Strength Set' : 'Edit Strength Set'}
              </Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setStrengthModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {/* Exercise Selector */}
            <Text style={styles.formLabel}>Exercise</Text>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setExercisePickerVisible(true)}
            >
              <Text style={[
                styles.selectorButtonText,
                !strengthForm.exercise_id && styles.selectorButtonPlaceholder
              ]}>
                {strengthForm.exercise_name || 'Select exercise...'}
              </Text>
              {strengthForm.muscle_group ? (
                <Text style={styles.selectorBadge}>{strengthForm.muscle_group}</Text>
              ) : null}
              <Text style={styles.selectorArrow}>▼</Text>
            </TouchableOpacity>
            
            {/* Sets, Reps, Weight */}
            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={styles.formLabel}>Sets</Text>
                <TextInput
                  style={styles.formNumberInput}
                  value={strengthForm.sets}
                  onChangeText={(val) => setStrengthForm({ ...strengthForm, sets: val })}
                  keyboardType="numeric"
                  placeholder="3"
                />
              </View>
              <View style={styles.formCol}>
                <Text style={styles.formLabel}>Reps</Text>
                <TextInput
                  style={styles.formNumberInput}
                  value={strengthForm.reps}
                  onChangeText={(val) => setStrengthForm({ ...strengthForm, reps: val })}
                  keyboardType="numeric"
                  placeholder="10"
                />
              </View>
              <View style={styles.formCol}>
                <Text style={styles.formLabel}>Weight (lbs)</Text>
                <TextInput
                  style={styles.formNumberInput}
                  value={strengthForm.weight}
                  onChangeText={(val) => setStrengthForm({ ...strengthForm, weight: val })}
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
              </View>
            </View>
            
            {/* Preview */}
            {strengthForm.exercise_id && (
              <View style={styles.formPreview}>
                <Text style={styles.formPreviewText}>
                  Total: {(
                    (parseInt(strengthForm.sets) || 0) * 
                    (parseInt(strengthForm.reps) || 0) * 
                    (parseFloat(strengthForm.weight) || 0)
                  ).toFixed(0)} lbs
                </Text>
              </View>
            )}
            
            {/* Buttons */}
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={styles.formCancelButton}
                onPress={() => setStrengthModalVisible(false)}
              >
                <Text style={styles.formCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formSubmitButton, isSaving && styles.formSubmitButtonDisabled]}
                onPress={handleSaveStrength}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.formSubmitButtonText}>
                    {strengthModalMode === 'add' ? 'Add Set' : 'Save Changes'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================== EXERCISE PICKER MODAL ==================== */}
      <Modal
        visible={exercisePickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setExercisePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.formModalTitle}>Select Exercise</Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setExercisePickerVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {/* Create New Exercise */}
            <TouchableOpacity
              style={styles.pickerCreateNew}
              onPress={() => {
                setExercisePickerVisible(false);
                setNewExerciseModalVisible(true);
              }}
            >
              <Text style={styles.pickerCreateNewText}>+ Create New Exercise</Text>
            </TouchableOpacity>
            
            {/* Muscle Group Filter */}
            <View style={styles.muscleGroupFilter}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[
                    styles.muscleGroupChip,
                    !selectedMuscleGroup && styles.muscleGroupChipActive
                  ]}
                  onPress={() => setSelectedMuscleGroup(null)}
                >
                  <Text style={[
                    styles.muscleGroupChipText,
                    !selectedMuscleGroup && styles.muscleGroupChipTextActive
                  ]}>All</Text>
                </TouchableOpacity>
                {muscleGroups.map((group) => (
                  <TouchableOpacity
                    key={group}
                    style={[
                      styles.muscleGroupChip,
                      selectedMuscleGroup === group && styles.muscleGroupChipActive
                    ]}
                    onPress={() => setSelectedMuscleGroup(group)}
                  >
                    <Text style={[
                      styles.muscleGroupChipText,
                      selectedMuscleGroup === group && styles.muscleGroupChipTextActive
                    ]}>
                      {group.charAt(0).toUpperCase() + group.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            
            {/* Exercise List */}
            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.exerciseOption}
                  onPress={() => handleSelectExercise(item)}
                >
                  <Text style={styles.exerciseOptionName}>{item.name}</Text>
                  <Text style={styles.exerciseOptionGroup}>{item.muscle_group}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyPicker}>
                  <Text style={styles.emptyPickerText}>No exercises found</Text>
                </View>
              }
              style={styles.pickerList}
            />
          </View>
        </View>
      </Modal>

      {/* ==================== CARDIO MODAL ==================== */}
      <Modal
        visible={cardioModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCardioModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.formModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.formModalTitle}>
                {cardioModalMode === 'add' ? 'Add Cardio' : 'Edit Cardio'}
              </Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setCardioModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {/* Cardio Type Selector */}
            <Text style={styles.formLabel}>Cardio Type</Text>
            <TouchableOpacity
              style={[styles.selectorButton, styles.selectorButtonCardio]}
              onPress={() => setCardioTypePickerVisible(true)}
            >
              <Text style={[
                styles.selectorButtonText,
                !cardioForm.cardio_type_id && styles.selectorButtonPlaceholder
              ]}>
                {cardioForm.cardio_type_name || 'Select cardio type...'}
              </Text>
              <Text style={styles.selectorArrow}>▼</Text>
            </TouchableOpacity>
            
            {/* Minutes and Distance */}
            <View style={styles.formRow}>
              <View style={[styles.formCol, { flex: 1 }]}>
                <Text style={styles.formLabel}>Minutes</Text>
                <TextInput
                  style={styles.formNumberInput}
                  value={cardioForm.minutes}
                  onChangeText={(val) => setCardioForm({ ...cardioForm, minutes: val })}
                  keyboardType="numeric"
                  placeholder="30"
                />
              </View>
              <View style={[styles.formCol, { flex: 1 }]}>
                <Text style={styles.formLabel}>Distance (optional)</Text>
                <TextInput
                  style={styles.formNumberInput}
                  value={cardioForm.distance}
                  onChangeText={(val) => setCardioForm({ ...cardioForm, distance: val })}
                  keyboardType="decimal-pad"
                  placeholder="0.0"
                />
              </View>
            </View>
            
            {/* Buttons */}
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={styles.formCancelButton}
                onPress={() => setCardioModalVisible(false)}
              >
                <Text style={styles.formCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formSubmitButton, styles.formSubmitButtonCardio, isSaving && styles.formSubmitButtonDisabled]}
                onPress={handleSaveCardio}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.formSubmitButtonText}>
                    {cardioModalMode === 'add' ? 'Add Cardio' : 'Save Changes'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================== CARDIO TYPE PICKER MODAL ==================== */}
      <Modal
        visible={cardioTypePickerVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCardioTypePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.formModalTitle}>Select Cardio Type</Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setCardioTypePickerVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {/* Create New Cardio Type */}
            <TouchableOpacity
              style={[styles.pickerCreateNew, styles.pickerCreateNewCardio]}
              onPress={() => {
                setCardioTypePickerVisible(false);
                setNewCardioTypeModalVisible(true);
              }}
            >
              <Text style={[styles.pickerCreateNewText, { color: '#FF9500' }]}>
                + Create New Cardio Type
              </Text>
            </TouchableOpacity>
            
            {/* Cardio Type List */}
            <FlatList
              data={cardioTypesData || []}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.exerciseOption}
                  onPress={() => handleSelectCardioType(item)}
                >
                  <Text style={styles.exerciseOptionName}>{item.name}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyPicker}>
                  <Text style={styles.emptyPickerText}>No cardio types found</Text>
                </View>
              }
              style={styles.pickerList}
            />
          </View>
        </View>
      </Modal>

      {/* ==================== NEW EXERCISE MODAL ==================== */}
      <Modal
        visible={newExerciseModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setNewExerciseModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.formModalContent}>
            <Text style={styles.formModalTitle}>Create Exercise</Text>
            
            <Text style={styles.formLabel}>Exercise Name</Text>
            <TextInput
              style={styles.formInput}
              value={newExerciseName}
              onChangeText={setNewExerciseName}
              placeholder="e.g., Bench Press"
              autoFocus
            />
            
            <Text style={styles.formLabel}>Muscle Group</Text>
            <TextInput
              style={styles.formInput}
              value={newExerciseMuscleGroup}
              onChangeText={setNewExerciseMuscleGroup}
              placeholder="e.g., chest, back, legs"
            />
            
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={styles.formCancelButton}
                onPress={() => {
                  setNewExerciseModalVisible(false);
                  setNewExerciseName('');
                  setNewExerciseMuscleGroup('');
                }}
              >
                <Text style={styles.formCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.formSubmitButton, isCreatingExercise && styles.formSubmitButtonDisabled]}
                onPress={handleCreateExercise}
                disabled={isCreatingExercise}
              >
                {isCreatingExercise ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.formSubmitButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================== NEW CARDIO TYPE MODAL ==================== */}
      <Modal
        visible={newCardioTypeModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setNewCardioTypeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.formModalContent}>
            <Text style={styles.formModalTitle}>Create Cardio Type</Text>
            
            <Text style={styles.formLabel}>Cardio Type Name</Text>
            <TextInput
              style={styles.formInput}
              value={newCardioTypeName}
              onChangeText={setNewCardioTypeName}
              placeholder="e.g., Running, Cycling, Swimming"
              autoFocus
            />
            
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={styles.formCancelButton}
                onPress={() => {
                  setNewCardioTypeModalVisible(false);
                  setNewCardioTypeName('');
                }}
              >
                <Text style={styles.formCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.formSubmitButton, styles.formSubmitButtonCardio, isCreatingCardioType && styles.formSubmitButtonDisabled]}
                onPress={handleCreateCardioType}
                disabled={isCreatingCardioType}
              >
                {isCreatingCardioType ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.formSubmitButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050509',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#050509',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#9ca3af',
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f87171',
    marginBottom: 8,
  },
  errorDetail: {
    fontSize: 12,
    color: '#9ca3af',
  },
  dateHeader: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  dateLabel: {
    fontSize: 14,
    color: '#9ca3af',
  },
  dateValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f9fafb',
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statCardWeight: {
    // Removed individual backgrounds - now using unified dark card
  },
  statCardReps: {
  },
  statCardCardio: {
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f9fafb',
  },
  statLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#111827',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#a855f7',
    paddingLeft: 12,
    marginLeft: -4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f9fafb',
  },
  notesInput: {
    backgroundColor: '#1e1e2e',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
    color: '#f9fafb',
    borderWidth: 1,
    borderColor: '#333',
  },
  addButton: {
    backgroundColor: '#a855f7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonCardio: {
    backgroundColor: '#a855f7',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyEntries: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  // Record Card Styles
  recordCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#a855f7',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  cardioRecordCard: {
    borderLeftColor: '#c084fc',
  },
  recordMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recordInfo: {
    flex: 1,
  },
  recordExercise: {
    fontSize: 17,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 2,
  },
  recordMuscleGroup: {
    fontSize: 13,
    color: '#a855f7',
    marginBottom: 6,
  },
  recordStats: {
    marginBottom: 4,
  },
  recordStatText: {
    fontSize: 15,
    color: '#e5e7eb',
  },
  recordTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: '#c084fc',
  },
  recordActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a855f7',
  },
  editButtonCardio: {
    backgroundColor: 'rgba(192, 132, 252, 0.2)',
    borderColor: '#c084fc',
  },
  editButtonText: {
    color: '#a855f7',
    fontWeight: '600',
    fontSize: 14,
  },
  deleteRecordButton: {
    padding: 6,
  },
  deleteRecordButtonText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '700',
  },
  // Save Message
  saveMessage: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  saveMessageText: {
    color: '#4ade80',
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  formModalContent: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  pickerModalContent: {
    backgroundColor: '#111827',
    borderRadius: 8,
    maxHeight: '80%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  formModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f9fafb',
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
    marginTop: 8,
  },
  formInput: {
    backgroundColor: '#1e1e2e',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 8,
    color: '#f9fafb',
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  formCol: {
    flex: 1,
  },
  formNumberInput: {
    backgroundColor: '#1e1e2e',
    borderRadius: 10,
    padding: 14,
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#333',
    color: '#f9fafb',
  },
  formPreview: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  formPreviewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c084fc',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  formCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#1f2937',
    alignItems: 'center',
  },
  formCancelButtonText: {
    color: '#9ca3af',
    fontWeight: '600',
    fontSize: 16,
  },
  formSubmitButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#a855f7',
    alignItems: 'center',
  },
  formSubmitButtonCardio: {
    backgroundColor: '#a855f7',
  },
  formSubmitButtonDisabled: {
    opacity: 0.7,
  },
  formSubmitButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  // Selector Button (in form)
  selectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e2e',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  selectorButtonCardio: {
    borderColor: '#333',
  },
  selectorButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#f9fafb',
    fontWeight: '500',
  },
  selectorButtonPlaceholder: {
    color: '#6b7280',
  },
  selectorBadge: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  selectorArrow: {
    fontSize: 12,
    color: '#a855f7',
  },
  // Picker Modal
  pickerCreateNew: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    margin: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  pickerCreateNewCardio: {
    backgroundColor: 'rgba(192, 132, 252, 0.15)',
    borderColor: 'rgba(192, 132, 252, 0.3)',
  },
  pickerCreateNewText: {
    color: '#a855f7',
    fontWeight: '600',
    fontSize: 15,
  },
  muscleGroupFilter: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  muscleGroupChip: {
    backgroundColor: '#1f2937',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  muscleGroupChipActive: {
    backgroundColor: '#a855f7',
  },
  muscleGroupChipText: {
    fontSize: 14,
    color: '#9ca3af',
    fontWeight: '500',
  },
  muscleGroupChipTextActive: {
    color: '#fff',
  },
  pickerList: {
    maxHeight: 350,
  },
  exerciseOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  exerciseOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f9fafb',
  },
  exerciseOptionGroup: {
    fontSize: 14,
    color: '#a855f7',
    marginTop: 4,
  },
  emptyPicker: {
    padding: 32,
    alignItems: 'center',
  },
  emptyPickerText: {
    fontSize: 16,
    color: '#9ca3af',
  },
});
