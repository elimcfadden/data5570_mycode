from django.contrib import admin
from .models import Exercise, Workout, WorkoutEntry


@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ['name', 'muscle_group']
    list_filter = ['muscle_group']
    search_fields = ['name']


class WorkoutEntryInline(admin.TabularInline):
    model = WorkoutEntry
    extra = 1


@admin.register(Workout)
class WorkoutAdmin(admin.ModelAdmin):
    list_display = ['date', 'user', 'entry_count', 'total_weight']
    list_filter = ['date', 'user']
    date_hierarchy = 'date'
    inlines = [WorkoutEntryInline]

    def entry_count(self, obj):
        return obj.entries.count()
    entry_count.short_description = 'Entries'


@admin.register(WorkoutEntry)
class WorkoutEntryAdmin(admin.ModelAdmin):
    list_display = ['workout', 'exercise', 'sets', 'reps', 'weight', 'total_weight']
    list_filter = ['exercise__muscle_group', 'workout__date']
    search_fields = ['exercise__name']
