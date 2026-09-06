import os
from google import genai
from pydantic import BaseModel, Field

# Ensure we have the API key
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

class AssessmentQuestion(BaseModel):
    id: str = Field(description="A unique snake_case identifier for this question")
    question_text: str = Field(description="The question to ask the user")
    question_type: str = Field(description="Either 'text' or 'choice'")
    options: list[str] | None = Field(description="List of options if question_type is 'choice'", default=None)

class AssessmentResponse(BaseModel):
    questions: list[AssessmentQuestion] = Field(description="A list of 3-5 assessment questions")

def generate_assessment_questions(goal_name: str, initial_level: int, goal_type: str) -> dict:
    """
    Uses Gemini to generate dynamic assessment questions for a specific goal.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set.")

    # Initialize the genai client
    client = genai.Client(api_key=GEMINI_API_KEY)

    prompt = f"""
    The user has set a new goal: "{goal_name}".
    Goal type: {goal_type}
    Initial self-assessed level (1-10): {initial_level}

    You are an expert AI coach. Your job is to generate 3 to 5 highly relevant follow-up questions 
    to accurately determine their exact starting point and constraints before building their roadmap.

    For a fitness goal, ask about experience and equipment.
    For a career goal, ask about current skills, timeline, and resume status.
    For a learning goal, ask about preferred learning style and time commitment.

    Output the result as a valid JSON object matching the provided schema.
    """

    import time
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model='gemini-3.6-flash',
                contents=prompt,
                config={
                    'response_mime_type': 'application/json',
                    'response_schema': AssessmentResponse,
                    'temperature': 0.7,
                },
            )
            
            assessment_data = AssessmentResponse.model_validate_json(response.text)
            return assessment_data.model_dump()
            
        except Exception as e:
            print(f"Error calling Gemini AI (Attempt {attempt+1}/3): {e}")
            if attempt < 2:
                time.sleep(2 ** attempt) # Exponential backoff: 1s, 2s
            else:
                # Fallback dummy response
                return {
                    "questions": [
                        {
                            "id": "q1_fallback",
                            "question_text": "What is your main challenge with this goal?",
                            "question_type": "text",
                            "options": None
                        }
                    ]
                }


class RoadmapObjectiveSchema(BaseModel):
    title: str = Field(description="Title of the weekly objective")
    description: str = Field(description="Brief explanation of what this objective entails")

class RoadmapPhaseSchema(BaseModel):
    title: str = Field(description="Title of the phase or month")
    description: str = Field(description="High level summary of the phase")
    estimated_weeks: int = Field(description="Estimated number of weeks this phase should take")
    objectives: list[RoadmapObjectiveSchema] = Field(description="List of objectives within this phase, typically one per week")

class RoadmapResponseSchema(BaseModel):
    estimated_completion_date: str | None = Field(description="The estimated date (YYYY-MM-DD) to achieve the goal if no deadline was provided, or the provided deadline if it was.", default=None)
    phases: list[RoadmapPhaseSchema] = Field(description="List of sequential phases to achieve the goal")

def generate_roadmap(goal_name: str, initial_level: int, goal_type: str, assessment_data: dict, deadline: str | None = None) -> dict:
    """
    Uses Gemini to generate a complete strategic roadmap based on the goal and user's assessment answers.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set. Please add a valid Gemini API key to your .env file.")

    client = genai.Client(api_key=GEMINI_API_KEY)

    prompt = f"""
    The user wants to achieve this goal: "{goal_name}".
    Goal type: {goal_type}
    Current self-assessed level (1-10): {initial_level}
    Target Deadline: {deadline if deadline else "Not provided"}

    Here are the user's answers to the assessment questions:
    {assessment_data}

    You are an elite strategic planner. Break this goal down into a logical roadmap.
    1. Divide the journey into high-level Phases (e.g., Month 1, Month 2, etc).
    2. For each Phase, define the estimated weeks it will take.
    3. Within each Phase, break it down into sequential Objectives (usually 1 objective per week).
    
    DEADLINE INSTRUCTIONS:
    - If a Target Deadline is provided, strictly design the phases and objectives to fit within this timeline. If the deadline is very tight, adjust the scope of the objectives to be realistic but still fit the timeline.
    - If no Target Deadline is provided, analyze the goal and generate a realistic `estimated_completion_date` (in YYYY-MM-DD format), then design the roadmap to meet that date.

    Output the result as a strict JSON object matching the provided schema.
    """

    import time
    last_error = None
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model='gemini-3.6-flash',
                contents=prompt,
                config={
                    'response_mime_type': 'application/json',
                    'response_schema': RoadmapResponseSchema,
                    'temperature': 0.7,
                },
            )
            
            roadmap_data = RoadmapResponseSchema.model_validate_json(response.text)
            return roadmap_data.model_dump()

        except Exception as e:
            print(f"Error calling Gemini AI for roadmap (Attempt {attempt+1}/3): {e}")
            last_error = e
            if attempt < 2:
                time.sleep(2 ** attempt)
            
    raise ValueError(f"Failed to generate roadmap with AI after 3 attempts: {str(last_error)}")

class ScheduledItemSchema(BaseModel):
    item_type: str = Field(description="Either 'TASK' or 'BREAK'")
    name: str = Field(description="Name of the task or break")
    duration_minutes: int = Field(description="Duration in minutes")

class BlockPlacementSchema(BaseModel):
    block_id: int = Field(description="The ID of the free block selected")
    items: list[ScheduledItemSchema] = Field(description="Sequential tasks and breaks within this block")

class OptimalScheduleResponseSchema(BaseModel):
    selected_blocks: list[BlockPlacementSchema] = Field(description="The optimal blocks chosen to fulfill the target hours")
    warning_message: str | None = Field(description="If total available free time is less than daily_target_hours, provide a friendly warning message to inform the user.", default=None)

def generate_optimal_schedule(objective_title: str, objective_desc: str, daily_target_hours: float, free_blocks: list[dict]) -> dict:
    """
    Uses Gemini to intelligently select the best free blocks and chunk the work into tasks and psychological breaks.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set.")

    client = genai.Client(api_key=GEMINI_API_KEY)
    
    target_minutes = int(daily_target_hours * 60)
    
    blocks_str = "\n".join([f"ID: {b['id']} | Start: {b['start']} | End: {b['end']} | Duration: {b['duration']} mins" for b in free_blocks])

    prompt = f"""
    The user is working on this weekly objective: "{objective_title}"
    Description: {objective_desc}

    The user wants to spend exactly {target_minutes} minutes today on this goal.
    Here is a list of their available free time blocks today:
    {blocks_str}
    
    You are an elite productivity and psychology coach.
    1. Select the most optimal block(s) from the list to fulfill the {target_minutes} minutes. (e.g. morning for deep focus).
    2. Within the selected blocks, break the work down into intense focus 'TASK's and inject 10-15 minute psychological 'BREAK's between them.
    3. Ensure the sum of task and break durations within a block does not exceed the block's total duration.
    4. If the sum of all available free blocks is LESS than {target_minutes} minutes, schedule all available time and provide a friendly `warning_message` explaining that their schedule is too packed to meet the full target today.

    Output the result as a strict JSON object matching the provided schema.
    """

    import time
    last_error = None
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model='gemini-3.6-flash',
                contents=prompt,
                config={
                    'response_mime_type': 'application/json',
                    'response_schema': OptimalScheduleResponseSchema,
                    'temperature': 0.6,
                },
            )
            
            schedule_data = OptimalScheduleResponseSchema.model_validate_json(response.text)
            return schedule_data.model_dump()

        except Exception as e:
            print(f"Error calling Gemini AI for optimal schedule (Attempt {attempt+1}/3): {e}")
            last_error = e
            if attempt < 2:
                time.sleep(2 ** attempt)
                
    print(f"Fallback due to error: {last_error}")
    return {"selected_blocks": [], "warning_message": "AI scheduling failed due to network error."}

class ScheduledActivitySchema(BaseModel):
    activity_id: str = Field(description="The UUID of the everyday activity")
    start_time_hh_mm: str = Field(description="The scheduled start time in HH:MM format (24-hour)")
    duration_minutes: int = Field(description="The duration of the activity in minutes")

class EverydayScheduleResponseSchema(BaseModel):
    placements: list[ScheduledActivitySchema] = Field(description="Optimal placements for all provided everyday activities")

def generate_everyday_schedule(activities: list[dict], free_blocks: list[dict], wake_up: str, bedtime: str) -> list[dict]:
    """
    Uses Gemini to schedule everyday activities intelligently, following Indian timings where applicable.
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY is not set.")

    if not activities:
        return []

    client = genai.Client(api_key=GEMINI_API_KEY)
    
    blocks_str = "\n".join([f"ID: {b['id']} | Start: {b['start']} | End: {b['end']} | Duration: {b['duration']} mins" for b in free_blocks])
    activities_str = "\n".join([f"ID: {a['id']} | Name: {a['name']} | Duration: {a['duration_minutes']} mins | Preferred: {a.get('preferred_time', 'Any')}" for a in activities])

    prompt = f"""
    The user is scheduling their 'Everyday Activities' for the day.
    Wake up time: {wake_up}
    Bedtime: {bedtime}

    Available Free Time Blocks:
    {blocks_str}

    Everyday Activities to Schedule:
    {activities_str}

    You are an AI assistant specialized in human routines and specifically Indian timing constraints.
    - Breakfast is typically around 8:00 AM - 9:30 AM
    - Lunch is typically around 1:00 PM - 2:30 PM
    - Dinner is typically around 8:00 PM - 9:30 PM
    - Bathing/Brushing usually happens right after waking up or before breakfast, and sometimes before dinner.

    Please place EVERY activity from the list into the provided Free Time Blocks.
    1. Ensure the start time and duration fit entirely within one of the provided free blocks.
    2. Respect the 'Preferred' time if provided.
    3. Make it natural and logical.
    
    Output the result as a strict JSON object matching the provided schema.
    """

    import time
    last_error = None
    for attempt in range(3):
        try:
            response = client.models.generate_content(
                model='gemini-3.6-flash',
                contents=prompt,
                config={
                    'response_mime_type': 'application/json',
                    'response_schema': EverydayScheduleResponseSchema,
                    'temperature': 0.5,
                },
            )
            
            schedule_data = EverydayScheduleResponseSchema.model_validate_json(response.text)
            return schedule_data.model_dump().get("placements", [])

        except Exception as e:
            print(f"Error calling Gemini AI for everyday activities (Attempt {attempt+1}/3): {e}")
            last_error = e
            if attempt < 2:
                time.sleep(2 ** attempt)
                
    print(f"Fallback due to error: {last_error}")
    return []

