from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Sum, Q, F, ExpressionWrapper, DecimalField
from decimal import Decimal
from datetime import datetime
from collections import defaultdict

from .models import Exercise, Workout, WorkoutEntry, CardioType, CardioEntry
from .serializers import (
    ExerciseSerializer,
    WorkoutEntrySerializer,
    DayWorkoutInputSerializer,
    CardioTypeSerializer,
    CardioEntrySerializer,
)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_month_workouts(request):
    """
    GET /api/workouts/month/?year=YYYY&month=MM
    
    Returns all workouts for a given month with their totals.
    Scoped to the authenticated user.
    Includes: month_total_weight, month_total_reps, month_total_cardio_minutes
    """
    # Parse query parameters
    try:
        year = int(request.query_params.get('year', datetime.now().year))
        month = int(request.query_params.get('month', datetime.now().month))
    except (ValueError, TypeError):
        return Response(
            {'error': 'Invalid year or month parameter'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate year is 2025 or 2026
    if year not in [2025, 2026]:
        return Response(
            {'error': 'Year must be 2025 or 2026'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate month is 1-12
    if month < 1 or month > 12:
        return Response(
            {'error': 'Month must be between 1 and 12'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get all workouts for the authenticated user in the specified month
    workouts = Workout.objects.filter(
        user=request.user,
        date__year=year,
        date__month=month
    ).prefetch_related('entries', 'entries__exercise', 'cardio_entries', 'cardio_entries__cardio_type')
    
    # Build the response
    days_with_workouts = []
    month_total_weight = Decimal('0.00')
    month_total_reps = 0
    month_total_cardio_minutes = 0
    
    for workout in workouts:
        day_total_weight = Decimal('0.00')
        day_total_reps = 0
        day_total_cardio_minutes = 0
        
        # Strength entries
        for entry in workout.entries.all():
            entry_weight = entry.sets * entry.reps * entry.weight
            day_total_weight += entry_weight
            day_total_reps += entry.sets * entry.reps
        
        # Cardio entries
        for cardio in workout.cardio_entries.all():
            day_total_cardio_minutes += cardio.minutes
        
        days_with_workouts.append({
            'date': workout.date.isoformat(),
            'day_total_weight': f"{day_total_weight:.2f}",
            'day_total_reps': day_total_reps,
            'day_total_cardio_minutes': day_total_cardio_minutes,
        })
        
        month_total_weight += day_total_weight
        month_total_reps += day_total_reps
        month_total_cardio_minutes += day_total_cardio_minutes
    
    # Sort by date
    days_with_workouts.sort(key=lambda x: x['date'])
    
    return Response({
        'year': year,
        'month': month,
        'days_with_workouts': days_with_workouts,
        'month_total_weight': f"{month_total_weight:.2f}",
        'month_total_reps': month_total_reps,
        'month_total_cardio_minutes': month_total_cardio_minutes,
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def day_workout(request):
    """
    GET /api/workouts/day/?date=YYYY-MM-DD
    POST /api/workouts/day/
    
    Get or save a workout for a specific date.
    Scoped to the authenticated user.
    Supports both strength entries and cardio entries.
    """
    if request.method == 'GET':
        # Parse date from query parameter
        date_str = request.query_params.get('date')
        if not date_str:
            return Response(
                {'error': 'Date parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Try to get existing workout for this user
        try:
            workout = Workout.objects.prefetch_related(
                'entries', 'entries__exercise',
                'cardio_entries', 'cardio_entries__cardio_type'
            ).get(user=request.user, date=date)
            
            # Serialize entries
            entries_data = WorkoutEntrySerializer(workout.entries.all(), many=True).data
            cardio_entries_data = CardioEntrySerializer(workout.cardio_entries.all(), many=True).data
            
            # Calculate day totals
            day_total_weight = Decimal('0.00')
            day_total_reps = 0
            day_total_cardio_minutes = 0
            
            for entry in workout.entries.all():
                day_total_weight += entry.sets * entry.reps * entry.weight
                day_total_reps += entry.sets * entry.reps
            
            for cardio in workout.cardio_entries.all():
                day_total_cardio_minutes += cardio.minutes
            
            return Response({
                'date': date.isoformat(),
                'notes': '',  # Notes field not in model yet, placeholder
                'entries': entries_data,
                'cardio_entries': cardio_entries_data,
                'day_total_weight': f"{day_total_weight:.2f}",
                'day_total_reps': day_total_reps,
                'day_total_cardio_minutes': day_total_cardio_minutes,
            })
            
        except Workout.DoesNotExist:
            # Return empty workout structure
            return Response({
                'date': date.isoformat(),
                'notes': '',
                'entries': [],
                'cardio_entries': [],
                'day_total_weight': '0.00',
                'day_total_reps': 0,
                'day_total_cardio_minutes': 0,
            })
    
    elif request.method == 'POST':
        # Validate input
        serializer = DayWorkoutInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        date = data['date']
        entries_data = data.get('entries', [])
        cardio_entries_data = data.get('cardio_entries', [])
        
        # Find or create workout for this user and date
        workout, created = Workout.objects.get_or_create(
            user=request.user,
            date=date
        )
        
        # Delete existing strength entries
        workout.entries.all().delete()
        
        # Create new strength entries
        for entry_data in entries_data:
            try:
                # Allow exercises that belong to this user OR are shared (user=null)
                exercise = Exercise.objects.get(
                    Q(user=request.user) | Q(user__isnull=True),
                    id=entry_data['exercise_id']
                )
            except Exercise.DoesNotExist:
                return Response(
                    {'error': f"Exercise with id {entry_data['exercise_id']} does not exist or is not accessible"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            WorkoutEntry.objects.create(
                workout=workout,
                exercise=exercise,
                sets=entry_data['sets'],
                reps=entry_data['reps'],
                weight=entry_data['weight']
            )
        
        # Delete existing cardio entries
        workout.cardio_entries.all().delete()
        
        # Create new cardio entries
        for cardio_data in cardio_entries_data:
            try:
                cardio_type = CardioType.objects.get(
                    user=request.user,
                    id=cardio_data['cardio_type_id']
                )
            except CardioType.DoesNotExist:
                return Response(
                    {'error': f"Cardio type with id {cardio_data['cardio_type_id']} does not exist or is not accessible"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            CardioEntry.objects.create(
                workout=workout,
                cardio_type=cardio_type,
                minutes=cardio_data['minutes'],
                distance=cardio_data.get('distance')
            )
        
        # Check if workout has any entries (strength OR cardio) after sync
        # If no entries at all, delete the workout entirely so the day is not treated as a workout day
        if not workout.entries.exists() and not workout.cardio_entries.exists():
            workout.delete()
            return Response({
                'date': date.isoformat(),
                'notes': '',
                'entries': [],
                'cardio_entries': [],
                'day_total_weight': '0.00',
                'day_total_reps': 0,
                'day_total_cardio_minutes': 0,
            }, status=status.HTTP_200_OK)
        
        # Reload workout with entries
        workout.refresh_from_db()
        entries = workout.entries.select_related('exercise').all()
        cardio_entries = workout.cardio_entries.select_related('cardio_type').all()
        
        entries_response = WorkoutEntrySerializer(entries, many=True).data
        cardio_entries_response = CardioEntrySerializer(cardio_entries, many=True).data
        
        # Calculate day totals
        day_total_weight = Decimal('0.00')
        day_total_reps = 0
        day_total_cardio_minutes = 0
        
        for entry in entries:
            day_total_weight += entry.sets * entry.reps * entry.weight
            day_total_reps += entry.sets * entry.reps
        
        for cardio in cardio_entries:
            day_total_cardio_minutes += cardio.minutes
        
        return Response({
            'date': date.isoformat(),
            'notes': data.get('notes', ''),
            'entries': entries_response,
            'cardio_entries': cardio_entries_response,
            'day_total_weight': f"{day_total_weight:.2f}",
            'day_total_reps': day_total_reps,
            'day_total_cardio_minutes': day_total_cardio_minutes,
        }, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_summary(request):
    """
    GET /api/analytics/summary/
    
    Returns aggregated statistics by muscle group and overall totals.
    Now includes cardio statistics.
    Muscle groups are now dynamically derived from the user's data.
    Scoped to the authenticated user.
    """
    # Get all workouts for the authenticated user
    workouts = Workout.objects.filter(user=request.user).prefetch_related(
        'entries', 'entries__exercise',
        'cardio_entries', 'cardio_entries__cardio_type'
    )
    
    # Use defaultdict to dynamically accumulate muscle group stats
    muscle_group_stats = defaultdict(lambda: {'total_sets': 0, 'total_weight': Decimal('0.00')})
    
    # Calculate strength totals
    total_workouts = workouts.count()
    overall_total_weight = Decimal('0.00')
    overall_total_reps = 0
    
    for workout in workouts:
        for entry in workout.entries.all():
            mg = entry.exercise.muscle_group
            entry_total_weight = entry.sets * entry.reps * entry.weight
            
            # Add to muscle group stats (dynamic)
            muscle_group_stats[mg]['total_sets'] += entry.sets
            muscle_group_stats[mg]['total_weight'] += entry_total_weight
            
            # Add to overall totals
            overall_total_weight += entry_total_weight
            overall_total_reps += entry.sets * entry.reps
    
    # Build strength muscle group response
    by_muscle_group = []
    for mg, stats in sorted(muscle_group_stats.items()):
        if stats['total_sets'] > 0 or stats['total_weight'] > 0:
            by_muscle_group.append({
                'muscle_group': mg,
                'total_sets': stats['total_sets'],
                'total_weight': f"{stats['total_weight']:.2f}"
            })
    
    # Calculate cardio totals
    cardio_type_stats = defaultdict(lambda: {'total_minutes': 0, 'total_distance': Decimal('0.00')})
    cardio_overall_minutes = 0
    cardio_overall_distance = Decimal('0.00')
    
    for workout in workouts:
        for cardio in workout.cardio_entries.all():
            ct_name = cardio.cardio_type.name
            cardio_type_stats[ct_name]['total_minutes'] += cardio.minutes
            if cardio.distance:
                cardio_type_stats[ct_name]['total_distance'] += cardio.distance
            
            cardio_overall_minutes += cardio.minutes
            if cardio.distance:
                cardio_overall_distance += cardio.distance
    
    # Build cardio by_cardio_type response
    by_cardio_type = []
    for ct_name, stats in sorted(cardio_type_stats.items()):
        by_cardio_type.append({
            'cardio_type': ct_name,
            'total_minutes': stats['total_minutes'],
            'total_distance': f"{stats['total_distance']:.2f}" if stats['total_distance'] > 0 else None
        })
    
    return Response({
        'by_muscle_group': by_muscle_group,
        'overall': {
            'total_workouts': total_workouts,
            'total_weight': f"{overall_total_weight:.2f}",
            'total_reps': overall_total_reps,
        },
        'cardio_overall': {
            'total_minutes': cardio_overall_minutes,
            'total_distance': f"{cardio_overall_distance:.2f}" if cardio_overall_distance > 0 else None
        },
        'by_cardio_type': by_cardio_type,
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def exercise_list(request):
    """
    GET /api/exercises/
    Returns a list of exercises for the authenticated user.
    
    POST /api/exercises/
    Creates a new exercise for the authenticated user.
    Muscle group is now fully customizable (any string).
    """
    if request.method == 'GET':
        # Return exercises belonging to this user OR shared exercises (user=null)
        exercises = Exercise.objects.filter(
            Q(user=request.user) | Q(user__isnull=True)
        ).order_by('name')
        serializer = ExerciseSerializer(exercises, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        name = request.data.get('name', '').strip()
        muscle_group = request.data.get('muscle_group', '').strip()
        
        if not name:
            return Response(
                {'error': 'Exercise name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not muscle_group:
            return Response(
                {'error': 'Muscle group is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if exercise already exists for this user
        if Exercise.objects.filter(user=request.user, name__iexact=name).exists():
            return Response(
                {'error': 'You already have an exercise with this name'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create exercise with custom muscle group
        exercise = Exercise.objects.create(
            user=request.user,
            name=name,
            muscle_group=muscle_group
        )
        
        serializer = ExerciseSerializer(exercise)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def cardio_type_list(request):
    """
    GET /api/cardio-types/
    Returns a list of cardio types for the authenticated user.
    
    POST /api/cardio-types/
    Creates a new cardio type for the authenticated user.
    """
    if request.method == 'GET':
        cardio_types = CardioType.objects.filter(user=request.user).order_by('name')
        serializer = CardioTypeSerializer(cardio_types, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        name = request.data.get('name', '').strip()
        
        if not name:
            return Response(
                {'error': 'Cardio type name is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if cardio type already exists for this user
        if CardioType.objects.filter(user=request.user, name__iexact=name).exists():
            return Response(
                {'error': 'You already have a cardio type with this name'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create cardio type
        cardio_type = CardioType.objects.create(
            user=request.user,
            name=name
        )
        
        serializer = CardioTypeSerializer(cardio_type)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def exercise_history(request):
    """
    GET /api/analytics/exercise-history/?exercise_id=<id>
    
    Returns the history of a specific exercise for the logged-in user.
    For each workout date where the exercise was logged, returns:
    - total_volume (sum of sets * reps * weight)
    - total_reps (sum of sets * reps)
    - avg_weight_per_rep (total_volume / total_reps)
    
    Scoped to the authenticated user.
    """
    # Validate exercise_id parameter
    exercise_id = request.query_params.get('exercise_id')
    if not exercise_id:
        return Response(
            {'error': 'exercise_id parameter is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        exercise_id = int(exercise_id)
    except (ValueError, TypeError):
        return Response(
            {'error': 'exercise_id must be a valid integer'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Validate that the exercise belongs to this user or is shared
    try:
        exercise = Exercise.objects.get(
            Q(user=request.user) | Q(user__isnull=True),
            id=exercise_id
        )
    except Exercise.DoesNotExist:
        return Response(
            {'error': 'Exercise not found or not accessible'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Aggregate workout entries for this exercise belonging to the user's workouts
    volume_expr = ExpressionWrapper(
        F('sets') * F('reps') * F('weight'),
        output_field=DecimalField(max_digits=12, decimal_places=2)
    )

    qs = (
        WorkoutEntry.objects
        .filter(workout__user=request.user, exercise_id=exercise_id)
        .values('workout__date')
        .annotate(
            total_volume=Sum(volume_expr),
            total_reps=Sum(F('sets') * F('reps')),
        )
        .order_by('workout__date')
    )

    # Build points array, only for days with reps > 0
    points = []
    for row in qs:
        total_reps = row['total_reps'] or 0
        if total_reps > 0:
            total_volume = row['total_volume'] or Decimal('0.00')
            avg_weight_per_rep = total_volume / Decimal(total_reps)
            points.append({
                'date': row['workout__date'].isoformat(),
                'total_volume': f"{total_volume:.2f}",
                'total_reps': total_reps,
                'avg_weight_per_rep': f"{avg_weight_per_rep:.2f}"
            })
    
    return Response({
        'exercise': {
            'id': exercise.id,
            'name': exercise.name,
            'muscle_group': exercise.muscle_group
        },
        'points': points
    })
