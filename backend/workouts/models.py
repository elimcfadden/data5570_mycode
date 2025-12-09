from django.db import models
from django.contrib.auth.models import User


class Exercise(models.Model):
    """
    Represents an exercise with its associated muscle group.
    Each exercise belongs to a specific user.
    Muscle groups are now fully customizable - users can enter any string.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='exercises',
        null=True,
        blank=True
    )
    name = models.CharField(max_length=100)
    muscle_group = models.CharField(
        max_length=50,
        default='other'
    )

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.muscle_group})"


class CardioType(models.Model):
    """
    Represents a type of cardio exercise (e.g., Running, Cycling, Swimming).
    Each cardio type belongs to a specific user.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='cardio_types'
    )
    name = models.CharField(max_length=100)

    class Meta:
        ordering = ['name']
        unique_together = ['user', 'name']

    def __str__(self):
        return self.name


class Workout(models.Model):
    """
    Represents a workout session on a specific date.
    One workout per date per user.
    Contains both strength entries and cardio entries.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='workouts',
        null=True,
        blank=True
    )
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']
        # Ensure one workout per date per user
        unique_together = ['user', 'date']

    def __str__(self):
        return f"Workout on {self.date}"

    @property
    def total_weight(self):
        """
        Calculate total weight lifted for this workout.
        Sum of (sets * reps * weight) for all strength entries.
        """
        total = 0
        for entry in self.entries.all():
            total += entry.sets * entry.reps * entry.weight
        return total

    @property
    def total_reps(self):
        """
        Calculate total reps for this workout.
        Sum of (sets * reps) for all strength entries.
        """
        total = 0
        for entry in self.entries.all():
            total += entry.sets * entry.reps
        return total

    @property
    def total_cardio_minutes(self):
        """
        Calculate total cardio minutes for this workout.
        Sum of minutes for all cardio entries.
        """
        total = 0
        for entry in self.cardio_entries.all():
            total += entry.minutes
        return total


class WorkoutEntry(models.Model):
    """
    Represents a single strength exercise entry within a workout.
    Each entry has: exercise, sets, reps, weight.
    """
    workout = models.ForeignKey(
        Workout,
        on_delete=models.CASCADE,
        related_name='entries'
    )
    exercise = models.ForeignKey(
        Exercise,
        on_delete=models.CASCADE,
        related_name='workout_entries'
    )
    sets = models.PositiveIntegerField(default=1)
    reps = models.PositiveIntegerField(default=1)
    weight = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        default=0,
        help_text="Weight in pounds (or your preferred unit)"
    )

    class Meta:
        ordering = ['id']
        verbose_name_plural = 'Workout entries'

    def __str__(self):
        return f"{self.exercise.name}: {self.sets}x{self.reps} @ {self.weight}"

    @property
    def total_weight(self):
        """
        Calculate total weight for this single entry.
        Formula: sets * reps * weight
        """
        return self.sets * self.reps * float(self.weight)


class CardioEntry(models.Model):
    """
    Represents a single cardio entry within a workout.
    Each entry has: cardio_type, minutes, and optional distance.
    """
    workout = models.ForeignKey(
        Workout,
        on_delete=models.CASCADE,
        related_name='cardio_entries'
    )
    cardio_type = models.ForeignKey(
        CardioType,
        on_delete=models.CASCADE,
        related_name='entries'
    )
    minutes = models.PositiveIntegerField(
        help_text="Duration in minutes"
    )
    distance = models.DecimalField(
        max_digits=7,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Distance (optional, in miles or km)"
    )

    class Meta:
        ordering = ['id']
        verbose_name_plural = 'Cardio entries'

    def __str__(self):
        dist = f" - {self.distance}" if self.distance else ""
        return f"{self.cardio_type.name}: {self.minutes} min{dist}"
