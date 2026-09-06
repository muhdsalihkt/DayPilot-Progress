from django.test import TestCase
from apps.goals.models import Goal, RoadmapPhase
from apps.tasks.models import Task
from django.contrib.auth import get_user_model
from apps.goals.services import calculate_goal_progress

User = get_user_model()

class GoalProgressTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='test@test.com', password='password123')
        self.goal = Goal.objects.create(
            user=self.user,
            name="Test Goal",
            priority=1,
            goal_type="SKILL",
            initial_estimate_level=5
        )
        self.phase = RoadmapPhase.objects.create(
            goal=self.goal,
            title="Phase 1",
            description="Test Phase",
            order=1
        )

    def test_progress_with_no_tasks(self):
        calculate_goal_progress(self.goal)
        self.goal.refresh_from_db()
        self.assertEqual(self.goal.progress_percentage, 0)

    def test_progress_with_completed_tasks(self):
        # High priority (3 pts)
        task1 = Task.objects.create(goal=self.goal, user=self.user, name="T1", priority=3, status=Task.Status.COMPLETED, duration_minutes=30)
        # Medium priority (2 pts)
        task2 = Task.objects.create(goal=self.goal, user=self.user, name="T2", priority=2, status=Task.Status.PENDING, duration_minutes=30)
        
        calculate_goal_progress(self.goal)
        self.goal.refresh_from_db()
        
        # Max points = 5. Earned points = 3. 3/5 = 60%
        self.assertEqual(self.goal.progress_percentage, 60)

    def test_progress_with_skipped_tasks(self):
        # High priority (3 pts) - COMPLETED
        Task.objects.create(goal=self.goal, user=self.user, name="T1", priority=3, status=Task.Status.COMPLETED, duration_minutes=30)
        # Low priority (1 pt) - SKIPPED (Should be ignored in max_points)
        Task.objects.create(goal=self.goal, user=self.user, name="T2", priority=1, status=Task.Status.SKIPPED, duration_minutes=30)
        
        calculate_goal_progress(self.goal)
        self.goal.refresh_from_db()
        
        # Max points = 3. Earned points = 3. 3/3 = 100%
        self.assertEqual(self.goal.progress_percentage, 100)
