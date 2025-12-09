from rest_framework import serializers
from decimal import Decimal
from .models import Exercise, Workout, WorkoutEntry, CardioType, CardioEntry


class ExerciseSerializer(serializers.ModelSerializer):
    """
    Serializer for Exercise model.
    Used for the exercises list endpoint.
    """
    class Meta:
        model = Exercise
        fields = ['id', 'name', 'muscle_group']


class CardioTypeSerializer(serializers.ModelSerializer):
    """
    Serializer for CardioType model.
    Used for the cardio types list endpoint.
    """
    class Meta:
        model = CardioType
        fields = ['id', 'name']


class WorkoutEntrySerializer(serializers.ModelSerializer):
    """
    Serializer for WorkoutEntry model.
    Includes computed fields for exercise details and total weight.
    """
    exercise_id = serializers.PrimaryKeyRelatedField(
        queryset=Exercise.objects.all(),
        source='exercise'
    )
    exercise_name = serializers.CharField(source='exercise.name', read_only=True)
    muscle_group = serializers.CharField(source='exercise.muscle_group', read_only=True)
    total_weight = serializers.SerializerMethodField()

    class Meta:
        model = WorkoutEntry
        fields = [
            'id',
            'exercise_id',
            'exercise_name',
            'muscle_group',
            'sets',
            'reps',
            'weight',
            'total_weight'
        ]
        read_only_fields = ['id', 'exercise_name', 'muscle_group', 'total_weight']

    def get_total_weight(self, obj):
        """Calculate total weight as sets * reps * weight, formatted to 2 decimal places."""
        total = obj.sets * obj.reps * obj.weight
        return f"{total:.2f}"


class CardioEntrySerializer(serializers.ModelSerializer):
    """
    Serializer for CardioEntry model.
    Includes nested cardio_type info for GET responses.
    """
    cardio_type_id = serializers.PrimaryKeyRelatedField(
        queryset=CardioType.objects.all(),
        source='cardio_type',
        write_only=True
    )
    cardio_type = CardioTypeSerializer(read_only=True)

    class Meta:
        model = CardioEntry
        fields = [
            'id',
            'cardio_type_id',
            'cardio_type',
            'minutes',
            'distance'
        ]
        read_only_fields = ['id', 'cardio_type']


class WorkoutEntryInputSerializer(serializers.Serializer):
    """
    Serializer for incoming workout entry data (POST requests).
    """
    exercise_id = serializers.IntegerField()
    sets = serializers.IntegerField(min_value=1)
    reps = serializers.IntegerField(min_value=1)
    weight = serializers.DecimalField(max_digits=7, decimal_places=2, min_value=Decimal('0'))


class CardioEntryInputSerializer(serializers.Serializer):
    """
    Serializer for incoming cardio entry data (POST requests).
    """
    cardio_type_id = serializers.IntegerField()
    minutes = serializers.IntegerField(min_value=1)
    distance = serializers.DecimalField(max_digits=7, decimal_places=2, min_value=Decimal('0'), required=False, allow_null=True)


class DayWorkoutInputSerializer(serializers.Serializer):
    """
    Serializer for incoming day workout data (POST /api/workouts/day/).
    Supports both strength entries and cardio entries.
    """
    date = serializers.DateField()
    notes = serializers.CharField(required=False, allow_blank=True, default='')
    entries = WorkoutEntryInputSerializer(many=True, required=False, default=[])
    cardio_entries = CardioEntryInputSerializer(many=True, required=False, default=[])


class DayWorkoutResponseSerializer(serializers.Serializer):
    """
    Serializer for day workout response.
    """
    date = serializers.DateField()
    notes = serializers.CharField()
    entries = WorkoutEntrySerializer(many=True)
    cardio_entries = CardioEntrySerializer(many=True)
    day_total_weight = serializers.CharField()
    day_total_reps = serializers.IntegerField()
    day_total_cardio_minutes = serializers.IntegerField()


class DayWithWorkoutSerializer(serializers.Serializer):
    """
    Serializer for a day with workout in the month view.
    """
    date = serializers.DateField()
    day_total_weight = serializers.CharField()
    day_total_reps = serializers.IntegerField()
    day_total_cardio_minutes = serializers.IntegerField()


class MonthWorkoutsResponseSerializer(serializers.Serializer):
    """
    Serializer for month workouts response.
    """
    year = serializers.IntegerField()
    month = serializers.IntegerField()
    days_with_workouts = DayWithWorkoutSerializer(many=True)
    month_total_weight = serializers.CharField()
    month_total_reps = serializers.IntegerField()
    month_total_cardio_minutes = serializers.IntegerField()


class MuscleGroupStatsSerializer(serializers.Serializer):
    """
    Serializer for muscle group statistics in analytics.
    """
    muscle_group = serializers.CharField()
    total_sets = serializers.IntegerField()
    total_weight = serializers.CharField()


class CardioTypeStatsSerializer(serializers.Serializer):
    """
    Serializer for cardio type statistics in analytics.
    """
    cardio_type = serializers.CharField()
    total_minutes = serializers.IntegerField()
    total_distance = serializers.CharField(allow_null=True)


class CardioOverallSerializer(serializers.Serializer):
    """
    Serializer for overall cardio statistics.
    """
    total_minutes = serializers.IntegerField()
    total_distance = serializers.CharField(allow_null=True)


class OverallStatsSerializer(serializers.Serializer):
    """
    Serializer for overall statistics in analytics.
    """
    total_workouts = serializers.IntegerField()
    total_weight = serializers.CharField()
    total_reps = serializers.IntegerField()


class AnalyticsSummaryResponseSerializer(serializers.Serializer):
    """
    Serializer for analytics summary response.
    """
    by_muscle_group = MuscleGroupStatsSerializer(many=True)
    overall = OverallStatsSerializer()
    cardio_overall = CardioOverallSerializer()
    by_cardio_type = CardioTypeStatsSerializer(many=True)
