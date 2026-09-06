from datetime import date, datetime, timedelta, time
from django.utils import timezone
from .models import DailySchedule, ScheduleBlock, FixedCommitment, EverydayActivity
from apps.tasks.models import Task
from apps.users.models import UserProfile
from apps.goals.models import Goal
from apps.ai.services import generate_optimal_schedule, generate_everyday_schedule

def add_minutes_to_time(t: time, mins: int) -> time:
    dt = datetime.combine(date.today(), t) + timedelta(minutes=mins)
    return dt.time()

def time_difference_minutes(start: time, end: time) -> int:
    dt1 = datetime.combine(date.today(), start)
    # Handle overnight (end < start)
    if end < start:
        dt2 = datetime.combine(date.today() + timedelta(days=1), end)
    else:
        dt2 = datetime.combine(date.today(), end)
    return int((dt2 - dt1).total_seconds() / 60)

class SchedulingEngine:
    def __init__(self, user, target_date: date):
        self.user = user
        self.target_date = target_date
        
        try:
            self.profile = UserProfile.objects.get(user=user)
        except UserProfile.DoesNotExist:
            raise ValueError("User profile not found. Cannot schedule.")
            
        self.wake_up = self.profile.wake_up_time or time(7, 0)
        self.bedtime = self.profile.bedtime or time(23, 0)
        
        # Determine day of week index (0=Monday, 6=Sunday)
        self.weekday_idx = str(self.target_date.weekday())
        
    def generate_schedule(self) -> DailySchedule:
        # Delete existing schedule for this date if it exists
        DailySchedule.objects.filter(user=self.user, date=self.target_date).delete()
        
        self.schedule = DailySchedule.objects.create(user=self.user, date=self.target_date)
        
        self._schedule_sleep()
        self._schedule_fixed_commitments()
        self._schedule_everyday_activities()
        self._fill_free_blocks_with_tasks()
        
        return self.schedule
        
    def _schedule_sleep(self):
        # Morning sleep (Midnight to Wake up)
        ScheduleBlock.objects.create(
            schedule=self.schedule,
            start_time=time(0, 0),
            end_time=self.wake_up,
            block_type=ScheduleBlock.BlockType.SLEEP,
            title="Sleep"
        )
        # Night sleep (Bedtime to Midnight)
        ScheduleBlock.objects.create(
            schedule=self.schedule,
            start_time=self.bedtime,
            end_time=time(23, 59, 59),
            block_type=ScheduleBlock.BlockType.SLEEP,
            title="Sleep"
        )
        
    def _schedule_fixed_commitments(self):
        commitments = FixedCommitment.objects.filter(user=self.user, is_active=True)
        for c in commitments:
            if self.weekday_idx in c.days_of_week.split(','):
                ScheduleBlock.objects.create(
                    schedule=self.schedule,
                    start_time=c.start_time,
                    end_time=c.end_time,
                    block_type=ScheduleBlock.BlockType.FIXED,
                    title=c.name,
                    fixed_commitment=c
                )
                
    def _schedule_everyday_activities(self):
        activities = EverydayActivity.objects.filter(user=self.user, is_active=True)
        if not activities.exists():
            return

        free_blocks = self._get_free_blocks()
        if not free_blocks:
            return

        blocks_for_ai = []
        for i, b in enumerate(free_blocks):
            blocks_for_ai.append({
                'id': i,
                'start': b['start'].strftime('%H:%M'),
                'end': b['end'].strftime('%H:%M'),
                'duration': b['duration']
            })

        activities_list = []
        activities_map = {}
        for a in activities:
            a_id_str = str(a.id)
            activities_map[a_id_str] = a
            activities_list.append({
                'id': a_id_str,
                'name': a.name,
                'duration_minutes': a.duration_minutes,
                'preferred_time': a.preferred_time
            })

        ai_placements = generate_everyday_schedule(
            activities=activities_list,
            free_blocks=blocks_for_ai,
            wake_up=self.wake_up.strftime('%H:%M'),
            bedtime=self.bedtime.strftime('%H:%M')
        )

        if ai_placements:
            for p in ai_placements:
                a_id_str = p.get('activity_id')
                start_str = p.get('start_time_hh_mm')
                dur = p.get('duration_minutes', 15)
                
                if a_id_str in activities_map and start_str:
                    try:
                        hh, mm = map(int, start_str.split(':'))
                        start_time = time(hh, mm)
                        end_time = add_minutes_to_time(start_time, dur)
                        
                        a_obj = activities_map[a_id_str]
                        
                        ScheduleBlock.objects.create(
                            schedule=self.schedule,
                            start_time=start_time,
                            end_time=end_time,
                            block_type=ScheduleBlock.BlockType.EVERYDAY,
                            title=a_obj.name,
                            everyday_activity=a_obj
                        )
                        # Remove from map so we don't schedule it twice or fallback
                        del activities_map[a_id_str]
                    except Exception as e:
                        print(f"Error placing everyday activity {a_id_str}: {e}")

        # Fallback for any unplaced activities
        current_time = self.wake_up
        for a_id_str, a in activities_map.items():
            end_time = add_minutes_to_time(current_time, a.duration_minutes)
            ScheduleBlock.objects.create(
                schedule=self.schedule,
                start_time=current_time,
                end_time=end_time,
                block_type=ScheduleBlock.BlockType.EVERYDAY,
                title=a.name,
                everyday_activity=a
            )
            current_time = end_time

    def _get_free_blocks(self):
        # Find gaps between scheduled blocks from wake_up to bedtime
        blocks = self.schedule.blocks.all().order_by('start_time')
        free_blocks = []
        
        # Start looking from the last everyday activity or wake_up
        # Simplify: just look through all blocks chronologically
        current_marker = self.wake_up
        
        for b in blocks:
            if b.block_type == ScheduleBlock.BlockType.SLEEP and b.start_time == time(0,0):
                continue # Skip morning sleep block
                
            if current_marker < b.start_time:
                # We found a gap
                gap_mins = time_difference_minutes(current_marker, b.start_time)
                if gap_mins >= 30: # Only care about gaps >= 30 mins
                    free_blocks.append({
                        'start': current_marker,
                        'end': b.start_time,
                        'duration': gap_mins
                    })
            current_marker = max(current_marker, b.end_time) if current_marker < b.end_time else current_marker
            
        return free_blocks

    def _fill_free_blocks_with_tasks(self):
        free_blocks = self._get_free_blocks()
        if not free_blocks:
            return
            
        goal = Goal.objects.filter(user=self.user, is_active=True).first()
        if not goal:
            return
            
        phase = goal.phases.first()
        if not phase:
            return
            
        objective = phase.objectives.filter(is_completed=False).first()
        if not objective:
            return

        # Prepare free blocks for AI
        blocks_for_ai = []
        for i, b in enumerate(free_blocks):
            blocks_for_ai.append({
                'id': i,
                'start': b['start'].strftime('%H:%M'),
                'end': b['end'].strftime('%H:%M'),
                'duration': b['duration']
            })

        # Call Gemini to intelligently schedule within these blocks
        ai_schedule = generate_optimal_schedule(
            objective_title=objective.title, 
            objective_desc=objective.description, 
            daily_target_hours=goal.daily_target_hours, 
            free_blocks=blocks_for_ai
        )
        
        # Save warning message if any
        if ai_schedule.get('warning_message'):
            self.schedule.warning_message = ai_schedule['warning_message']
            self.schedule.save()

        # Place tasks/breaks into the schedule
        for selected_block in ai_schedule.get('selected_blocks', []):
            block_idx = selected_block.get('block_id')
            if block_idx is None or block_idx >= len(free_blocks):
                continue
                
            original_block = free_blocks[block_idx]
            current_start = original_block['start']
            
            for item in selected_block.get('items', []):
                item_dur = item.get('duration_minutes', 15)
                end_time = add_minutes_to_time(current_start, item_dur)
                
                # Ensure we don't bleed past the original block's end_time
                if current_start >= original_block['end']:
                    break
                
                item_type = item.get('item_type', 'TASK')
                name = item.get('name', 'Goal Task')
                
                if item_type == 'TASK':
                    task_obj = Task.objects.create(
                        user=self.user,
                        goal=goal,
                        objective=objective,
                        name=name,
                        duration_minutes=item_dur
                    )
                    ScheduleBlock.objects.create(
                        schedule=self.schedule,
                        start_time=current_start,
                        end_time=end_time,
                        block_type=ScheduleBlock.BlockType.TASK,
                        title=name,
                        task=task_obj
                    )
                else:
                    ScheduleBlock.objects.create(
                        schedule=self.schedule,
                        start_time=current_start,
                        end_time=end_time,
                        block_type=ScheduleBlock.BlockType.BREAK,
                        title=name
                    )
                
                current_start = end_time
