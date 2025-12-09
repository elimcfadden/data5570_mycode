/**
 * CalendarScreen (Home Screen)
 * 
 * Displays a monthly calendar view for workout tracking.
 * - Month/year dropdown selectors (years limited to 2025-2026)
 * - 7-column calendar grid - FITS ENTIRELY ON SCREEN (no scroll)
 * - Days with workouts are highlighted with purple border
 * - Shows monthly stats: total weight, total reps, total cardio time
 * - Tap any day to navigate to WorkoutDayScreen
 */

import React, { useMemo, useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Modal,
  FlatList,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { uiActions } from '../store';
import { useGetMonthWorkoutsQuery } from '../store/apiSlice';

// Month names for display
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Day names for header
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Valid years per spec
const VALID_YEARS = [2025, 2026];

// Format minutes to "Xh Ym" format
const formatCardioTime = (minutes) => {
  if (!minutes || minutes === 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CALENDAR_PADDING = 12;
const TILE_GAP = 3;
const TILE_SIZE = (SCREEN_WIDTH - 32 - (CALENDAR_PADDING * 2) - (TILE_GAP * 6)) / 7;

export default function CalendarScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  // Dropdown modal states
  const [yearDropdownVisible, setYearDropdownVisible] = useState(false);
  const [monthDropdownVisible, setMonthDropdownVisible] = useState(false);
  
  // Get selected month/year from Redux UI state
  const { selectedMonth, selectedYear } = useSelector((state) => state.ui);
  
  // Fetch month data using RTK Query
  const { 
    data, 
    error, 
    isLoading, 
    isFetching,
  } = useGetMonthWorkoutsQuery({ 
    year: selectedYear, 
    month: selectedMonth 
  });

  // Build a Set of dates that have workouts for quick lookup
  const workoutDatesSet = useMemo(() => {
    if (!data?.days_with_workouts) return new Set();
    return new Set(data.days_with_workouts.map(d => d.date));
  }, [data?.days_with_workouts]);

  // Build calendar grid data
  const calendarCells = useMemo(() => {
    // First day of the month (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1).getDay();
    
    // Number of days in the month
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    
    // Build array: leading blanks + actual days
    const cells = [];
    
    // Add leading blank cells
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push({ type: 'blank', key: `blank-${i}` });
    }
    
    // Add day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const hasWorkout = workoutDatesSet.has(dateStr);
      cells.push({
        type: 'day',
        day,
        dateStr,
        hasWorkout,
        key: dateStr,
      });
    }
    
    return cells;
  }, [selectedYear, selectedMonth, workoutDatesSet]);

  // Handle month change
  const handleMonthSelect = (month) => {
    dispatch(uiActions.setSelectedMonth(month));
    setMonthDropdownVisible(false);
  };

  // Handle year change
  const handleYearSelect = (year) => {
    dispatch(uiActions.setSelectedYear(year));
    setYearDropdownVisible(false);
  };

  // Handle day press
  const handleDayPress = (dateStr) => {
    dispatch(uiActions.setSelectedDate(dateStr));
    navigation.navigate('WorkoutDay', { date: dateStr });
  };

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading calendar</Text>
        <Text style={styles.errorDetail}>
          {JSON.stringify(error.data || error.error || error)}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Monthly Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {parseFloat(data?.month_total_weight || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </Text>
          <Text style={styles.statLabel}>lbs lifted</Text>
          {isFetching && <ActivityIndicator size="small" color="#a855f7" style={styles.fetchingIndicator} />}
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {(data?.month_total_reps || 0).toLocaleString('en-US')}
          </Text>
          <Text style={styles.statLabel}>total reps</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {formatCardioTime(data?.month_total_cardio_minutes || 0)}
          </Text>
          <Text style={styles.statLabel}>cardio</Text>
        </View>
      </View>

      {/* Year and Month Dropdown Selectors */}
      <View style={styles.selectorRow}>
        {/* Year Dropdown */}
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => setYearDropdownVisible(true)}
        >
          <Text style={styles.dropdownLabel}>Year</Text>
          <Text style={styles.dropdownValue}>{selectedYear}</Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>

        {/* Month Dropdown */}
        <TouchableOpacity
          style={[styles.dropdown, styles.dropdownMonth]}
          onPress={() => setMonthDropdownVisible(true)}
        >
          <Text style={styles.dropdownLabel}>Month</Text>
          <Text style={styles.dropdownValue}>{MONTH_NAMES[selectedMonth - 1]}</Text>
          <Text style={styles.dropdownArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      {/* Calendar Grid - Fits on screen without scroll */}
      <View style={styles.calendarContainer}>
        {/* Day Headers */}
        <View style={styles.dayHeaderRow}>
          {DAY_NAMES.map((day) => (
            <View key={day} style={styles.dayHeaderCell}>
              <Text style={styles.dayHeaderText}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Calendar Days Grid */}
        <View style={styles.calendarGrid}>
          {calendarCells.map((cell) => {
            if (cell.type === 'blank') {
              return <View key={cell.key} style={styles.dayCell} />;
            }
            
            return (
              <TouchableOpacity
                key={cell.key}
                style={[
                  styles.dayCell,
                  styles.dayCellActive,
                  cell.hasWorkout && styles.dayCellWithWorkout
                ]}
                onPress={() => handleDayPress(cell.dateStr)}
              >
                <Text style={[
                  styles.dayText,
                  cell.hasWorkout && styles.dayTextWithWorkout
                ]}>
                  {cell.day}
                </Text>
                {cell.hasWorkout && (
                  <View style={styles.workoutIndicator} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Year Dropdown Modal */}
      <Modal
        visible={yearDropdownVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setYearDropdownVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setYearDropdownVisible(false)}
        >
          <View style={styles.dropdownModal}>
            <Text style={styles.dropdownModalTitle}>Select Year</Text>
            {VALID_YEARS.map((year) => (
              <TouchableOpacity
                key={year}
                style={[
                  styles.dropdownOption,
                  selectedYear === year && styles.dropdownOptionSelected
                ]}
                onPress={() => handleYearSelect(year)}
              >
                <Text style={[
                  styles.dropdownOptionText,
                  selectedYear === year && styles.dropdownOptionTextSelected
                ]}>
                  {year}
                </Text>
                {selectedYear === year && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Month Dropdown Modal */}
      <Modal
        visible={monthDropdownVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setMonthDropdownVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMonthDropdownVisible(false)}
        >
          <View style={styles.dropdownModal}>
            <Text style={styles.dropdownModalTitle}>Select Month</Text>
            <FlatList
              data={MONTH_NAMES.map((name, index) => ({ name, month: index + 1 }))}
              keyExtractor={(item) => String(item.month)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownOption,
                    selectedMonth === item.month && styles.dropdownOptionSelected
                  ]}
                  onPress={() => handleMonthSelect(item.month)}
                >
                  <Text style={[
                    styles.dropdownOptionText,
                    selectedMonth === item.month && styles.dropdownOptionTextSelected
                  ]}>
                    {item.name}
                  </Text>
                  {selectedMonth === item.month && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
              style={styles.monthList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050509',
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
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#374151',
    marginVertical: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f9fafb',
  },
  statLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 2,
  },
  fetchingIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  selectorRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  dropdown: {
    flex: 1,
    backgroundColor: '#111827',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  dropdownMonth: {
    flex: 2,
  },
  dropdownLabel: {
    fontSize: 11,
    color: '#9ca3af',
    marginRight: 6,
  },
  dropdownValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#f9fafb',
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#a855f7',
  },
  calendarContainer: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    marginHorizontal: 16,
    borderRadius: 8,
    padding: CALENDAR_PADDING,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  dayHeaderRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  dayHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: 0.3,
  },
  calendarGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: TILE_GAP,
    alignContent: 'flex-start',
  },
  dayCell: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCellActive: {
    backgroundColor: '#111827',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#f9fafb',
  },
  dayCellWithWorkout: {
    backgroundColor: '#1a1033',
    borderColor: '#a855f7',
    borderWidth: 1.5,
  },
  dayText: {
    fontSize: 13,
    color: '#e5e7eb',
    fontWeight: '500',
  },
  dayTextWithWorkout: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  workoutIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#a855f7',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownModal: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 8,
    width: '80%',
    maxWidth: 300,
    maxHeight: '60%',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  dropdownModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f9fafb',
    textAlign: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 6,
  },
  dropdownOptionSelected: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },
  dropdownOptionText: {
    flex: 1,
    fontSize: 15,
    color: '#e5e7eb',
  },
  dropdownOptionTextSelected: {
    fontWeight: '600',
    color: '#a855f7',
  },
  checkmark: {
    fontSize: 16,
    color: '#a855f7',
    fontWeight: 'bold',
  },
  monthList: {
    maxHeight: 350,
  },
});
