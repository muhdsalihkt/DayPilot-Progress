from apps.tasks.models import Task
from .models import Goal

def calculate_goal_progress(goal: Goal) -> int:
    """
    Calculates the progress percentage of a goal based on its tasks.
    Rules (from PRD):
    - Progress is weighted by priority (Low=1, Medium=2, High=3)
    - Skipped tasks are EXCLUDED from the calculation
    - Incomplete tasks count as 0 towards earned points but remain in total pool
    """
    
    # Priority weighting mapping
    weight_map = {
        Task.Priority.LOW: 1,
        Task.Priority.MEDIUM: 2,
        Task.Priority.HIGH: 3
    }
    
    # Fetch all tasks for this goal, EXCLUDING skipped tasks
    valid_tasks = Task.objects.filter(goal=goal).exclude(status=Task.Status.SKIPPED)
    
    if not valid_tasks.exists():
        return 0
        
    total_possible_points = sum([weight_map.get(t.priority, 2) for t in valid_tasks])
    
    earned_points = sum([
        weight_map.get(t.priority, 2) 
        for t in valid_tasks 
        if t.status == Task.Status.COMPLETED
    ])
    
    if total_possible_points == 0:
        return 0
        
    percentage = int((earned_points / total_possible_points) * 100)
    
    # Cache the percentage on the goal model
    goal.progress_percentage = percentage
    goal.save(update_fields=['progress_percentage'])
    
    return percentage
