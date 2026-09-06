from django.test import TestCase
from datetime import time
from apps.scheduling.engine import add_minutes_to_time

class SchedulingEngineTests(TestCase):
    def test_add_minutes_to_time_simple(self):
        t1 = time(10, 30)
        t2 = add_minutes_to_time(t1, 45)
        self.assertEqual(t2.hour, 11)
        self.assertEqual(t2.minute, 15)

    def test_add_minutes_to_time_cross_midnight(self):
        t1 = time(23, 30)
        t2 = add_minutes_to_time(t1, 60)
        self.assertEqual(t2.hour, 0)
        self.assertEqual(t2.minute, 30)

    def test_add_minutes_to_time_exact_hour(self):
        t1 = time(9, 0)
        t2 = add_minutes_to_time(t1, 120)
        self.assertEqual(t2.hour, 11)
        self.assertEqual(t2.minute, 0)
