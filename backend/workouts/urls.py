from django.urls import path
from . import views

urlpatterns = [
    # Month endpoint - calendar view data
    path('workouts/month/', views.get_month_workouts, name='workouts-month'),
    
    # Day endpoint - get/save workout for a specific date
    path('workouts/day/', views.day_workout, name='workouts-day'),
    
    # Analytics endpoints - aggregated statistics
    path('analytics/summary/', views.analytics_summary, name='analytics-summary'),
    path('analytics/exercise-history/', views.exercise_history, name='exercise-history'),
    
    # Exercises endpoint - list/create exercises (for dropdowns)
    path('exercises/', views.exercise_list, name='exercises-list'),
    
    # Cardio types endpoint - list/create cardio types (for dropdowns)
    path('cardio-types/', views.cardio_type_list, name='cardio-types-list'),
]
