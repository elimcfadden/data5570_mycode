/**
 * AnalyticsScreen
 * 
 * Displays aggregated workout statistics.
 * - Totals: total workouts, total weight lifted, total reps
 * - Breakdown by muscle group: total sets, total weight per group (dynamic)
 * - Cardio totals: total time, total distance
 * - Breakdown by cardio type: total time, total distance per type
 * - Growth Over Time: line chart showing exercise progression
 */

import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Modal,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native';
import { 
  useGetAnalyticsSummaryQuery,
  useGetExercisesQuery,
  useGetExerciseHistoryQuery,
} from '../store/apiSlice';
import { VictoryChart, VictoryLine, VictoryAxis, VictoryTheme, VictoryPie } from 'victory';

// Victory chart is only used on native platforms
const isWeb = Platform.OS === 'web';

// Dynamic color palette for muscle groups
const COLORS = [
  '#E53935', '#8E24AA', '#3949AB', '#00ACC1', 
  '#43A047', '#FB8C00', '#757575', '#5C6BC0',
  '#26A69A', '#EC407A', '#7E57C2', '#66BB6A',
];

// Format minutes to "Xh Ym" format
const formatCardioTime = (minutes) => {
  if (!minutes || minutes === 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

// Parse "YYYY-MM-DD" as LOCAL date (no timezone shift)
const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  // month - 1 because JS months are 0-based
  return new Date(year, month - 1, day);
};

// Format a "YYYY-MM-DD" string as a local date label
const formatLocalDateLabel = (dateStr) => {
  const d = parseLocalDate(dateStr);
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  // Growth over time state
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [muscleGroupDropdownVisible, setMuscleGroupDropdownVisible] = useState(false);
  const [exerciseDropdownVisible, setExerciseDropdownVisible] = useState(false);

  // Fetch analytics data
  const { 
    data, 
    error, 
    isLoading, 
    isFetching,
    refetch,
  } = useGetAnalyticsSummaryQuery();

  // Fetch exercises for growth section
  const {
    data: exercisesData,
    isLoading: exercisesLoading,
  } = useGetExercisesQuery();

  // Fetch exercise history when an exercise is selected
  const {
    data: historyData,
    isLoading: historyLoading,
    error: historyError,
  } = useGetExerciseHistoryQuery(selectedExerciseId, {
    skip: !selectedExerciseId,
  });

  // Derive distinct muscle groups from exercises
  const muscleGroups = useMemo(() => {
    if (!exercisesData) return [];
    const groups = [...new Set(exercisesData.map(e => e.muscle_group))];
    return groups.sort();
  }, [exercisesData]);

  // Filter exercises by selected muscle group
  const filteredExercises = useMemo(() => {
    if (!exercisesData || !selectedMuscleGroup) return [];
    return exercisesData.filter(e => e.muscle_group === selectedMuscleGroup);
  }, [exercisesData, selectedMuscleGroup]);

  // Get selected exercise name
  const selectedExercise = useMemo(() => {
    if (!exercisesData || !selectedExerciseId) return null;
    return exercisesData.find(e => e.id === selectedExerciseId);
  }, [exercisesData, selectedExerciseId]);

  // Map history data to chart format (using local dates to avoid timezone shifts)
  const chartData = useMemo(() => {
    if (!historyData?.points) return [];
    return historyData.points.map(p => ({
      x: parseLocalDate(p.date),
      y: Number(p.avg_weight_per_rep || 0),
    }));
  }, [historyData]);

  // Compute max Y for chart domain (so Y-axis always starts at 0)
  const maxY = chartData.length > 0
    ? Math.max(...chartData.map((p) => p.y))
    : 0;
  const chartMaxY = maxY > 0 ? maxY * 1.1 : 1; // Add 10% headroom

  // Handle muscle group selection
  const handleMuscleGroupSelect = (group) => {
    setSelectedMuscleGroup(group);
    setSelectedExerciseId(null); // Reset exercise when muscle group changes
    setMuscleGroupDropdownVisible(false);
  };

  // Handle exercise selection
  const handleExerciseSelect = (exercise) => {
    setSelectedExerciseId(exercise.id);
    setExerciseDropdownVisible(false);
  };

  // Format weight for display
  const formatWeight = (weight) => {
    if (!weight) return '0';
    const num = parseFloat(weight);
    if (num >= 10000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    if (num >= 1000) {
      return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
    return num.toFixed(0);
  };

  // Get color for index (cycles through palette)
  const getColor = (index) => COLORS[index % COLORS.length];

  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  // Render error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error loading analytics</Text>
        <Text style={styles.errorDetail}>
          {JSON.stringify(error.data || error)}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const overall = data?.overall || { total_workouts: 0, total_weight: '0.00', total_reps: 0 };
  const byMuscleGroup = data?.by_muscle_group || [];
  const cardioOverall = data?.cardio_overall || { total_minutes: 0, total_distance: null };
  const byCardioType = data?.by_cardio_type || [];

  // Compute pie chart data from muscle group total_sets
  const totalSetsAllGroups = byMuscleGroup.reduce(
    (sum, g) => sum + (Number(g.total_sets) || 0),
    0
  );
  const pieData = totalSetsAllGroups > 0
    ? byMuscleGroup.map((g, index) => ({
        x: g.muscle_group.charAt(0).toUpperCase() + g.muscle_group.slice(1),
        y: Number(g.total_sets) || 0,
        color: COLORS[index % COLORS.length],
      }))
    : [];

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={isFetching}
          onRefresh={refetch}
          colors={['#4A90D9']}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Progress</Text>
        <Text style={styles.headerSubtitle}>All-time workout statistics</Text>
      </View>

      {/* === TOTALS SECTION === */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Totals</Text>
        
        {/* Overall Stats Card (Workouts, Weight, Reps, Cardio) */}
        <View style={styles.overallCard}>
          <View style={styles.overallStat}>
            <Text style={styles.overallValue}>{overall.total_workouts}</Text>
            <Text style={styles.overallLabel}>Workouts</Text>
          </View>
          
          <View style={styles.overallDivider} />
          
          <View style={styles.overallStat}>
            <Text style={styles.overallValue}>{formatWeight(overall.total_weight)}</Text>
            <Text style={styles.overallLabel}>lbs Lifted</Text>
          </View>
          
          <View style={styles.overallDivider} />
          
          <View style={styles.overallStat}>
            <Text style={styles.overallValue}>
              {(overall.total_reps || 0).toLocaleString('en-US')}
            </Text>
            <Text style={styles.overallLabel}>Reps</Text>
          </View>
          
          <View style={styles.overallDivider} />
          
          <View style={styles.overallStat}>
            <Text style={styles.overallValue}>
              {formatCardioTime(cardioOverall.total_minutes)}
            </Text>
            <Text style={styles.overallLabel}>Cardio</Text>
          </View>
        </View>
      </View>

      {/* === VIEW GROWTH OVER TIME SECTION === */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>View Growth Over Time</Text>
        
        {exercisesLoading ? (
          <View style={styles.growthLoadingContainer}>
            <ActivityIndicator size="small" color="#a855f7" />
            <Text style={styles.growthLoadingText}>Loading exercises...</Text>
          </View>
        ) : muscleGroups.length === 0 ? (
          <View style={styles.growthEmptyState}>
            <Text style={styles.growthEmptyText}>
              Log some workouts to see growth over time.
            </Text>
          </View>
        ) : (
          <View style={styles.growthContent}>
            {/* Muscle Group Dropdown */}
            <TouchableOpacity
              style={styles.growthDropdown}
              onPress={() => setMuscleGroupDropdownVisible(true)}
            >
              <Text style={styles.growthDropdownLabel}>Muscle Group</Text>
              <Text style={styles.growthDropdownValue}>
                {selectedMuscleGroup 
                  ? selectedMuscleGroup.charAt(0).toUpperCase() + selectedMuscleGroup.slice(1)
                  : 'Select muscle group...'}
              </Text>
              <Text style={styles.growthDropdownArrow}>▼</Text>
            </TouchableOpacity>

            {/* Exercise Dropdown (only shown when muscle group is selected) */}
            {selectedMuscleGroup && (
              <TouchableOpacity
                style={styles.growthDropdown}
                onPress={() => setExerciseDropdownVisible(true)}
              >
                <Text style={styles.growthDropdownLabel}>Exercise</Text>
                <Text style={styles.growthDropdownValue}>
                  {selectedExercise?.name || 'Select exercise...'}
                </Text>
                <Text style={styles.growthDropdownArrow}>▼</Text>
              </TouchableOpacity>
            )}

            {/* Instructions / Empty states */}
            {!selectedMuscleGroup && (
              <View style={styles.growthInstruction}>
                <Text style={styles.growthInstructionText}>
                  Select a muscle group to start.
                </Text>
              </View>
            )}

            {selectedMuscleGroup && !selectedExerciseId && (
              <View style={styles.growthInstruction}>
                <Text style={styles.growthInstructionText}>
                  Select an exercise to view its progression.
                </Text>
              </View>
            )}

            {/* Chart Loading */}
            {selectedExerciseId && historyLoading && (
              <View style={styles.chartLoadingContainer}>
                <ActivityIndicator size="large" color="#a855f7" />
                <Text style={styles.chartLoadingText}>Loading chart data...</Text>
              </View>
            )}

            {/* Chart Error */}
            {selectedExerciseId && historyError && (
              <View style={styles.chartErrorContainer}>
                <Text style={styles.chartErrorText}>
                  Error loading exercise history.
                </Text>
              </View>
            )}

            {/* No Data Message */}
            {selectedExerciseId && !historyLoading && !historyError && chartData.length === 0 && (
              <View style={styles.growthInstruction}>
                <Text style={styles.growthInstructionText}>
                  No data for this exercise yet. Log some workouts!
                </Text>
              </View>
            )}

            {/* The Chart */}
            {selectedExerciseId && !historyLoading && !historyError && chartData.length >= 1 && (
              <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>
                  {selectedExercise?.name} - Avg Weight Per Rep
                </Text>
                <VictoryChart
                  theme={VictoryTheme.material}
                  domainPadding={{ x: 15, y: 10 }}
                  scale={{ x: 'time' }}
                  domain={{ y: [0, chartMaxY] }}
                  width={screenWidth - 64}
                  height={200}
                >
                  <VictoryAxis
                    tickFormat={(t) => {
                      // t is already a local Date from chartData, just format it
                      const d = t instanceof Date ? t : parseLocalDate(String(t));
                      if (!d || Number.isNaN(d.getTime())) return '';
                      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                    }}
                    tickCount={4}
                  />
                  <VictoryAxis
                    dependentAxis
                    label="Avg Weight / Rep (lbs)"
                    style={{ axisLabel: { padding: 35 } }}
                  />
                  <VictoryLine
                    data={chartData}
                    interpolation="linear"
                  />
                </VictoryChart>
              </View>
            )}

            {/* Table view showing progression data (kept as before) */}
            {selectedExerciseId && !historyLoading && !historyError && chartData.length > 0 && (
              <View style={styles.chartFallback}>
                <View style={styles.chartTableHeader}>
                  <Text style={styles.chartTableHeaderText}>Date</Text>
                  <Text style={styles.chartTableHeaderText}>Avg Weight/Rep</Text>
                </View>
                {historyData?.points?.map((point, index) => (
                  <View key={index} style={styles.chartTableRow}>
                    <Text style={styles.chartTableCell}>{formatLocalDateLabel(point.date)}</Text>
                    <Text style={[styles.chartTableCell, styles.chartTableCellValue]}>
                      {point.avg_weight_per_rep} lbs
                    </Text>
                  </View>
                ))}
              </View>
            )}
            
            {/* Data Points Summary */}
            {selectedExerciseId && !historyLoading && !historyError && chartData.length > 0 && (
              <Text style={styles.chartSummary}>
                {chartData.length} workout{chartData.length !== 1 ? 's' : ''} logged
              </Text>
            )}
          </View>
        )}
      </View>

      {/* === BY MUSCLE GROUP BREAKDOWN === */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>By Muscle Group</Text>
        
        {byMuscleGroup.length > 0 ? (
          byMuscleGroup.map((group, index) => {
            const color = getColor(index);
            return (
              <View key={group.muscle_group} style={styles.muscleCard}>
                <View style={[styles.muscleIconContainer, { backgroundColor: color }]}>
                  <Text style={styles.muscleIcon}>
                    {group.muscle_group.charAt(0).toUpperCase()}
                  </Text>
                </View>
                
                <View style={styles.muscleInfo}>
                  <Text style={styles.muscleName}>
                    {group.muscle_group.charAt(0).toUpperCase() + group.muscle_group.slice(1)}
                  </Text>
                  <View style={styles.muscleStats}>
                    <View style={styles.muscleStat}>
                      <Text style={styles.muscleStatValue}>{group.total_sets}</Text>
                      <Text style={styles.muscleStatLabel}>sets</Text>
                    </View>
                    <View style={styles.muscleStat}>
                      <Text style={styles.muscleStatValue}>{formatWeight(group.total_weight)}</Text>
                      <Text style={styles.muscleStatLabel}>lbs</Text>
                    </View>
                  </View>
                </View>
                
                {/* Progress bar (visual indicator) */}
                <View style={styles.progressContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        backgroundColor: color,
                        width: `${Math.min(100, (parseInt(group.total_sets) / 100) * 100)}%`
                      }
                    ]} 
                  />
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>—</Text>
            <Text style={styles.emptyTitle}>No Strength Data Yet</Text>
            <Text style={styles.emptySubtitle}>
              Complete some workouts to see your muscle group breakdown!
            </Text>
          </View>
        )}

        {/* Pie Chart - Percentage of work by muscle group */}
        {pieData.length > 0 && (
          <View style={styles.pieContainer}>
            <Text style={styles.pieTitle}>Work Distribution by Muscle Group</Text>
            <VictoryPie
              data={pieData}
              colorScale={pieData.map(d => d.color)}
              labels={({ datum }) => `${datum.x}\n${Math.round((datum.y / totalSetsAllGroups) * 100)}%`}
              labelRadius={({ innerRadius }) => innerRadius + 60}
              style={{
                labels: { fontSize: 11, fill: '#333' },
              }}
              width={screenWidth - 64}
              height={280}
              padding={{ top: 20, bottom: 20, left: 50, right: 50 }}
            />
          </View>
        )}
      </View>

      {/* === BY CARDIO TYPE BREAKDOWN === */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>By Cardio Type</Text>
        
        {byCardioType.length > 0 ? (
          byCardioType.map((cardioType, index) => {
            const color = getColor(index + byMuscleGroup.length);
            return (
              <View key={cardioType.cardio_type} style={styles.muscleCard}>
                <View style={[styles.muscleIconContainer, { backgroundColor: color }]}>
                  <Text style={styles.muscleIcon}>
                    {cardioType.cardio_type.charAt(0).toUpperCase()}
                  </Text>
                </View>
                
                <View style={styles.muscleInfo}>
                  <Text style={styles.muscleName}>{cardioType.cardio_type}</Text>
                  <View style={styles.muscleStats}>
                    <View style={styles.muscleStat}>
                      <Text style={styles.muscleStatValue}>
                        {formatCardioTime(cardioType.total_minutes)}
                      </Text>
                      <Text style={styles.muscleStatLabel}>time</Text>
                    </View>
                    {cardioType.total_distance && (
                      <View style={styles.muscleStat}>
                        <Text style={styles.muscleStatValue}>
                          {parseFloat(cardioType.total_distance).toFixed(1)}
                        </Text>
                        <Text style={styles.muscleStatLabel}>dist</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                {/* Progress bar */}
                <View style={styles.progressContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { 
                        backgroundColor: color,
                        width: `${Math.min(100, (cardioType.total_minutes / 300) * 100)}%`
                      }
                    ]} 
                  />
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>—</Text>
            <Text style={styles.emptyTitle}>No Cardio Data Yet</Text>
            <Text style={styles.emptySubtitle}>
              Add some cardio sessions to see your cardio breakdown!
            </Text>
          </View>
        )}
      </View>

      {/* Bottom padding */}
      <View style={styles.bottomPadding} />

      {/* === MODALS === */}

      {/* Muscle Group Dropdown Modal */}
      <Modal
        visible={muscleGroupDropdownVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setMuscleGroupDropdownVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMuscleGroupDropdownVisible(false)}
        >
          <View style={styles.dropdownModal}>
            <Text style={styles.dropdownModalTitle}>Select Muscle Group</Text>
            <FlatList
              data={muscleGroups}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownOption,
                    selectedMuscleGroup === item && styles.dropdownOptionSelected
                  ]}
                  onPress={() => handleMuscleGroupSelect(item)}
                >
                  <Text style={[
                    styles.dropdownOptionText,
                    selectedMuscleGroup === item && styles.dropdownOptionTextSelected
                  ]}>
                    {item.charAt(0).toUpperCase() + item.slice(1)}
                  </Text>
                  {selectedMuscleGroup === item && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
              style={styles.dropdownList}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Exercise Dropdown Modal */}
      <Modal
        visible={exerciseDropdownVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setExerciseDropdownVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setExerciseDropdownVisible(false)}
        >
          <View style={styles.dropdownModal}>
            <Text style={styles.dropdownModalTitle}>Select Exercise</Text>
            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownOption,
                    selectedExerciseId === item.id && styles.dropdownOptionSelected
                  ]}
                  onPress={() => handleExerciseSelect(item)}
                >
                  <Text style={[
                    styles.dropdownOptionText,
                    selectedExerciseId === item.id && styles.dropdownOptionTextSelected
                  ]}>
                    {item.name}
                  </Text>
                  {selectedExerciseId === item.id && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
              style={styles.dropdownList}
              ListEmptyComponent={
                <View style={styles.dropdownEmpty}>
                  <Text style={styles.dropdownEmptyText}>No exercises in this muscle group.</Text>
                </View>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
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
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#a855f7',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    padding: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f9fafb',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 16,
  },
  overallCard: {
    backgroundColor: '#111827',
    padding: 20,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  overallStat: {
    alignItems: 'center',
    flex: 1,
  },
  overallValue: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#f9fafb',
  },
  overallLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  overallDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#374151',
  },
  cardioOverallCard: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 8,
    marginBottom: 0,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  cardioOverallTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 12,
  },
  cardioOverallStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  cardioOverallStat: {
    alignItems: 'center',
  },
  cardioOverallValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f9fafb',
  },
  cardioOverallLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  // Growth Section Styles
  growthLoadingContainer: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  growthLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9ca3af',
  },
  growthEmptyState: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  growthEmptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  growthContent: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  growthDropdown: {
    backgroundColor: '#1e1e2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  growthDropdownLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginRight: 8,
  },
  growthDropdownValue: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#f9fafb',
  },
  growthDropdownArrow: {
    fontSize: 12,
    color: '#a855f7',
  },
  growthInstruction: {
    padding: 20,
    alignItems: 'center',
  },
  growthInstructionText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  chartLoadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  chartLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9ca3af',
  },
  chartErrorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  chartErrorText: {
    fontSize: 14,
    color: '#f87171',
    textAlign: 'center',
  },
  chartContainer: {
    marginTop: 12,
    marginBottom: 12,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 8,
    maxHeight: 260,
    overflow: 'hidden',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f9fafb',
    textAlign: 'center',
    marginBottom: 8,
  },
  chartSummary: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 8,
  },
  chartFallback: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  chartTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#a855f7',
    padding: 12,
  },
  chartTableHeaderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  chartTableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    backgroundColor: '#0f172a',
  },
  chartTableCell: {
    flex: 1,
    fontSize: 14,
    color: '#e5e7eb',
    textAlign: 'center',
  },
  chartTableCellValue: {
    fontWeight: '600',
    color: '#c084fc',
  },
  // Muscle/Cardio Card Styles
  muscleCard: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  muscleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  muscleIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  muscleInfo: {
    flex: 1,
  },
  muscleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 4,
  },
  muscleStats: {
    flexDirection: 'row',
    gap: 16,
  },
  muscleStat: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  muscleStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#c084fc',
  },
  muscleStatLabel: {
    fontSize: 12,
    color: '#9ca3af',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#1f2937',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  emptyState: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  pieContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  pieTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f9fafb',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  tipsCard: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#c084fc',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
  },
  bottomPadding: {
    height: 24,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#f9fafb',
    textAlign: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  dropdownList: {
    maxHeight: 350,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 8,
  },
  dropdownOptionSelected: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
  },
  dropdownOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#e5e7eb',
  },
  dropdownOptionTextSelected: {
    fontWeight: '600',
    color: '#a855f7',
  },
  checkmark: {
    fontSize: 18,
    color: '#a855f7',
    fontWeight: 'bold',
  },
  dropdownEmpty: {
    padding: 20,
    alignItems: 'center',
  },
  dropdownEmptyText: {
    fontSize: 14,
    color: '#9ca3af',
  },
});
