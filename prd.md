# Product Requirements Document (PRD)

## Product: AI Daily Routine Roadmap & Progress Tracker

**Document version:** 1.0  
**Status:** Initial Product Specification  
**Primary platform:** Mobile-first web application  
**Primary users:** Anyone with one or more personal goals  
**Core concept:** An AI-generated, editable daily timeline from wake-up to sleep, connected to monthly and weekly roadmaps and weighted progress tracking.

---

# 1. Product Overview

The product is a personalized AI routine-planning web application.

Instead of asking users to manually create a large to-do list, the application first understands the user's basic information, fixed commitments, everyday activities, goals, priorities, and other relevant information. AI then creates:

- A monthly roadmap
- A weekly roadmap
- A rolling 7-day plan
- A detailed daily timeline from wake-up to sleep
- AI-generated tasks with durations and priorities
- Progress tracking based on the importance of goal-related tasks

The application is designed to help users organize real life around their goals while keeping the user's fixed commitments and personal routine intact.

The AI works primarily in the background. There is **no AI chat interface** in the product.

---

# 2. Problem Statement

People often know what they want to achieve but struggle to convert goals into a realistic daily routine.

Common problems include:

- Not knowing what to do each day
- Creating unrealistic schedules
- Forgetting normal daily activities
- Underestimating the time required for goals
- Having multiple goals competing for limited time
- Losing track of progress
- Manually breaking large goals into small tasks
- Rebuilding schedules repeatedly
- Using generic productivity apps that do not understand personal constraints

The product solves this by automatically converting user information and goals into a complete daily roadmap.

---

# 3. Product Vision

Build an intelligent personal routine planner that answers:

> "Given who I am, what I need to do, my commitments, and my goals, what should my entire day look like?"

The application should make planning almost effortless:

**Tell the system about yourself → define goals → AI creates the roadmap → follow the daily timeline → track progress.**

---

# 4. Product Goals

## Primary goals

1. Generate a personalized roadmap from user information and goals.
2. Create a complete wake-up-to-sleep daily timeline.
3. Automatically generate goal-related tasks.
4. Automatically determine task duration.
5. Automatically determine recurring tasks when needed.
6. Respect fixed commitments.
7. Allow users to edit selected task properties without manually creating tasks.
8. Track meaningful progress using weighted task importance.
9. Maintain monthly, weekly, and daily planning.
10. Generate the next 7 days in advance, with the next day being the most detailed.
11. Provide a mobile-first, low-friction user experience.
12. Provide secure authentication and an admin panel.

## Non-goals

The first version should not attempt to:

- Become a general-purpose manual to-do application.
- Provide an AI chatbot.
- Let users create arbitrary tasks.
- Let users delete AI-generated tasks.
- Automatically change future schedules based on behavioral patterns.
- Replace fixed commitments automatically.

---

# 5. Target Users

The application is goal-independent.

Possible users include people who want to:

- Learn a skill
- Prepare for exams
- Find a job
- Improve career skills
- Exercise
- Build habits
- Read books
- Work on personal projects
- Improve communication
- Manage multiple personal goals
- Organize everyday life

The system should not be restricted to one domain.

---

# 6. Core Product Principles

## 6.1 AI-first planning

The user should not need to manually convert goals into dozens of tasks.

AI should perform the decomposition and scheduling.

## 6.2 User control

The user can modify selected properties of AI-generated tasks, but the system maintains the core roadmap structure.

## 6.3 Fixed commitments are protected

Work, college, meals, travel, and other user-defined fixed commitments are locked and cannot be moved automatically by AI.

## 6.4 Complete daily timeline

The daily plan covers the entire period from wake-up to sleep.

## 6.5 Goal progress is separate from life scheduling

Normal everyday activities appear on the timeline but do not contribute to goal progress unless AI determines that a fixed commitment is actually related to a goal.

## 6.6 No punishment-oriented UX

Skipped tasks should not directly penalize progress.

## 6.7 Low cognitive load

The main screen should immediately answer:

- What am I doing now?
- What is next?
- What does the rest of my day look like?

---

# 7. User Onboarding Flow

The onboarding process should be progressive and adaptive.

## Phase 1: Basic personal information

Collect:

- Age
- Preferred wake-up time

The user selects a preferred wake-up time.

AI recommends the required sleep duration based on age and determines an appropriate bedtime.

The user does not directly determine the final bedtime.

## Phase 2: Fixed commitments

The user provides recurring or relevant fixed commitments.

Common categories should include:

- Work
- College
- School
- Meals
- Travel
- Appointments
- Family commitments
- Other common commitments

The user can also add custom fixed commitments.

Each fixed commitment should contain:

- Name/category
- Start time
- End time
- Recurrence
- Relevant days

Fixed commitments are locked for scheduling.

## Phase 3: Everyday activities

The application asks the user which everyday activities they want included in their timeline.

Examples:

- Brushing
- Bathing
- Morning routine
- Personal care
- Breakfast
- Family time
- Evening routine
- Other user-selected activities

AI suggests durations for these activities.

The user can edit their durations.

## Phase 4: Goals

The user can create an unlimited number of goals.

Each goal contains:

- Goal name
- Goal priority
- Goal type
- Deadline if time-bound
- Initial estimated level/progress

### Goal types

1. Time-bound
2. Ongoing

## Phase 5: AI assessment

The user gives an initial estimate of their current level.

AI then asks additional questions dynamically based on the user's answers and goal.

The goal-specific questions should not be identical for every goal.

Example:

For a fitness goal, AI may ask about experience and available equipment.

For a career goal, AI may ask about current skills, experience, target role, and preparation status.

AI determines the starting point from the collected information.

---

# 8. Goal Management

## 8.1 Unlimited goals

Users can have unlimited goals.

## 8.2 Goal priority

The user manually sets the priority of every goal.

Example:

1. Get a software job
2. Improve English
3. Fitness
4. Reading

Goal priority influences planning.

## 8.3 Goal deadline

A goal can be:

- Time-bound with a deadline
- Ongoing without a deadline

## 8.4 Goal completion

When a goal is completed:

- Mark the goal as completed.
- Remove its future tasks.
- Preserve historical progress and achievement information.

---

# 9. AI Goal Dependencies

AI automatically determines dependencies between goals and tasks.

Example:

**Learn Python → Build Python project**

The system should understand that relevant learning tasks may need to happen before dependent project tasks.

Dependencies should influence task ordering and roadmap generation.

---

# 10. Roadmap Hierarchy

The roadmap has three levels.

```text
Goals
  ↓
Monthly Roadmap
  ↓
Weekly Roadmap
  ↓
7-Day Daily Plan
```

## Monthly roadmap

Provides high-level objectives and milestones for the month.

## Weekly roadmap

Breaks the monthly objectives into weekly objectives and milestones.

The next week's roadmap is automatically generated.

## Daily roadmap

Provides the most detailed plan.

The system generates 7 days in advance.

The next day should be the most detailed day.

---

# 11. Daily Timeline

The daily timeline is the core feature.

It must cover:

**Wake-up → Sleep**

Example:

```text
06:30  Wake up
06:45  Morning routine
07:15  Exercise
08:00  Breakfast
09:00  Work
13:00  Lunch
14:00  Python practice
15:00  Short break
18:00  English practice
20:00  Dinner
21:30  Evening routine
22:30  Sleep
```

The timeline should include:

- Fixed commitments
- Goal-related tasks
- Everyday activities
- AI-generated short breaks
- Wake-up
- Sleep

---

# 12. Task System

All actionable activities are represented as tasks.

There is no separate habit-tracking mechanism in the core model.

Examples:

- Exercise
- Study
- Reading
- Job application
- English practice
- Meditation
- Personal activities

## Task ownership

AI creates all goal-related tasks.

Users cannot create new tasks.

## Task name

The task name cannot be edited by the user.

## Task duration

AI determines task duration.

The user can edit task duration.

AI may reduce task duration when necessary.

There is no hard minimum duration.

## Task priority

The user manually sets task priority.

Task priority is separate from goal priority.

## Task scheduling

AI schedules tasks based primarily on:

- Goal priority
- Task priority
- Available time
- Fixed commitments
- Dependencies

AI does not use user energy-level patterns for scheduling.

---

# 13. Recurring Tasks

Only AI creates recurring tasks.

AI determines when recurring tasks are appropriate based on the user's goals and requirements.

Examples:

- Exercise 3–4 times per week
- English practice daily
- Weekly review
- Repeated skill practice

Users do not manually configure recurring goal tasks.

---

# 14. Task Actions

The user can interact with generated tasks through quick actions and a detailed task view.

## Allowed actions

- Complete
- Mark incomplete
- Skip
- Reschedule
- Edit duration
- Edit priority

## Not allowed

- Create a new task
- Delete a task
- Rename a task

---

# 15. Task Status

Recommended task states:

- Pending
- In progress
- Completed
- Incomplete
- Skipped

Definitions:

### Completed

The user finished the task.

### Incomplete

The scheduled period passed without completion.

### Skipped

The user intentionally chose not to perform the task.

Skipped and incomplete are separate states.

---

# 16. Scheduling Rules

## Fixed commitments

Fixed commitments are locked.

AI must never move them automatically.

## Flexible activities

AI-generated tasks and everyday activities are flexible.

AI can rearrange them to accommodate changes.

## User changes

If the user changes a task's duration or priority, AI immediately recalculates affected future days.

The AI may freely rearrange affected flexible tasks.

Fixed commitments remain unchanged.

## Overloaded day

If the day contains more work than the available time, AI should attempt to fit everything.

AI may:

- Reduce goal-task durations
- Reduce everyday activity durations
- Reorganize flexible tasks
- Balance reductions based on priority and available time

AI should not simply drop low-priority tasks.

---

# 17. Breaks

AI automatically schedules short breaks.

Meals and rest periods supplied by the user are treated as fixed commitments.

Short breaks do not contribute to goal progress.

---

# 18. Progress Tracking

Progress is weighted by task importance.

Simple task count is not sufficient.

Example:

```text
High-priority task    → larger contribution
Medium-priority task  → medium contribution
Low-priority task     → smaller contribution
```

Only goal-related tasks contribute to goal progress.

Normal everyday activities do not contribute to progress.

AI may determine whether a fixed commitment is goal-related. If it is relevant to a goal, it can contribute to that goal's progress while remaining time-locked.

---

# 19. Skipped Task Progress Rules

Skipped tasks are excluded from progress calculation.

Example:

- Completed → contributes to progress
- Incomplete → contributes 0 for that task
- Skipped → excluded from the progress calculation

Skipping should not be treated as a failure.

The application may record skipped behavior for analytics and AI understanding, but it should not penalize the user.

---

# 20. Behavioral Learning

AI may observe:

- Completed tasks
- Incomplete tasks
- Skipped tasks

However, the AI should not automatically modify future scheduling based on these behavioral patterns.

User edits should not be treated as behavioral learning signals.

Example:

If a user changes a task from 60 minutes to 90 minutes, AI should not conclude that the user always needs 90 minutes for similar tasks.

Behavioral data is primarily for:

- Progress analysis
- User insights
- Future product intelligence where explicitly designed

It must not silently change the roadmap based only on behavior.

---

# 21. Rolling 7-Day Planning

The application maintains a rolling 7-day schedule.

Example:

```text
Today
Tomorrow
Day 3
Day 4
Day 5
Day 6
Day 7
```

Tomorrow should contain the highest level of detail.

When the user changes an important task:

1. Detect the change.
2. Identify affected future days.
3. Recalculate the affected schedule.
4. Preserve fixed commitments.
5. Reorganize flexible tasks.

---

# 22. Automatic Roadmap Generation

## Weekly

At the start of a new week:

- Generate the next weekly roadmap automatically.
- Use the monthly roadmap as the high-level source.
- Use remaining goals, priorities, deadlines, and dependencies.

## Monthly

At the beginning of a new month:

- Automatically generate the next monthly roadmap.
- Use remaining goals.
- Use deadlines.
- Use the user's existing roadmap state.

---

# 23. Daily Summary

At the end of the user's scheduled day, automatically generate a daily summary.

Example:

```text
Today's Summary

Goal tasks completed: 6
Goal tasks incomplete: 1
Goal tasks skipped: 2

Weighted progress: 78%

Time spent on goals: 4h 20m
```

The summary should be available as a historical record.

Only the daily summary is automatically generated.

---

# 24. Weekly and Monthly Progress

## Weekly

Show weekly progress without automatically generating a weekly summary report.

## Monthly

Show:

- Overall monthly progress
- Individual goal progress

Example:

```text
Monthly Progress

Overall: 76%

Get Software Job     72%
Improve English      64%
Fitness               81%
Reading               45%
```

---

# 25. Notifications

Notifications are optional.

Users can enable or disable notifications.

## Task-specific notifications

Users choose exactly which tasks should trigger notifications.

Example:

```text
☑ Python practice
☐ Exercise
☑ Job application
☐ Reading
```

## Notification timing

For a selected task:

- Notification is sent exactly at the task's scheduled start time.
- No pre-reminder is sent.

## Rescheduling

If the task is rescheduled:

- The notification automatically follows the latest scheduled time.

---

# 26. Authentication

The application requires a secure authentication system.

## Authentication methods

### Email + password

Flow:

```text
Enter email
    ↓
Send OTP
    ↓
Verify OTP
    ↓
Create/use password
    ↓
Authenticated
```

### Phone number + password

Flow:

```text
Enter phone number
    ↓
Send SMS OTP
    ↓
Verify OTP
    ↓
Create/use password
    ↓
Authenticated
```

### Google third-party sign-in

Support Google OAuth / third-party authentication.

The implementation can use a solution comparable to Django Allauth for social authentication, combined with JWT-based API authentication.

## JWT

Use:

- Access token
- Refresh token

The backend must securely handle token expiration, refresh, logout, and authentication failures.

## OTP requirements

OTP should have:

- Expiration
- Attempt limits
- Resend limits
- Secure storage/handling
- Verification status
- Protection against abuse

## Password security

Passwords must never be stored in plaintext.

Use a secure password hashing mechanism supported by the backend framework.

---

# 27. Authorization

The system requires role-based access control.

Minimum roles:

- User
- Admin

Users can only access their own:

- Profile
- Goals
- Roadmaps
- Tasks
- Progress
- Notifications
- Settings

Admins can access authorized administrative resources.

---

# 28. Admin Panel

The application must include a separate admin panel.

## Admin dashboard

Initial metrics:

- Total users
- Active users
- Inactive users
- New users
- Verified users
- Unverified users

## User management

Admin should be able to:

- Search users
- View users
- View user account information
- View registration method
- View email verification status
- View phone verification status
- View account creation date
- View last active time
- Activate users
- Deactivate users
- Lock/unlock accounts where required

Passwords and OTP values must never be visible to administrators.

## Admin analytics

Potential metrics:

- Daily active users
- Weekly active users
- Monthly active users
- Registration trends
- User activity trends

"Active user" definition should be explicitly defined during implementation, for example based on a successful authenticated activity within a configured time window.

---

# 29. Mobile-First UX Requirements

The product must be designed mobile-first.

The mobile experience is the primary product experience, not a desktop layout compressed onto a phone.

## Core UX principles

### Low cognitive load

Show only the information necessary for the current decision.

### Progressive disclosure

Keep detailed task information behind a task interaction rather than showing everything at once.

### Strong visual hierarchy

The current task should be more prominent than distant future tasks.

### One primary action

The most important action at any moment should be obvious.

### Fast task completion

Completing a task should require minimal interaction.

### Clear feedback

Actions such as complete, skip, and reschedule should provide immediate visual feedback.

### Non-punitive progress

Avoid interfaces that make users feel punished for skipping tasks.

### Consistency

Task interactions should behave consistently across the application.

---

# 30. Main User Screen

The main screen should be:

## Today's Timeline

When the user opens the application, immediately show:

- Today's date
- Current time/task
- Wake-up time
- Remaining timeline
- Current task highlighted
- Upcoming tasks
- Sleep time

The timeline is the primary interface.

Progress dashboards should not replace the timeline as the home screen.

---

# 31. Timeline Interaction

Users should have:

## Quick actions

Available directly on the timeline:

- Complete
- Skip
- Reschedule

## Full task view

Opening a task should expose:

- Task name
- Goal
- Priority
- Duration
- Scheduled time
- Status
- Reschedule controls
- Duration editing
- Priority editing

Task name remains read-only.

---

# 32. Suggested Navigation

A possible mobile-first navigation structure:

```text
Home
  └── Today's Timeline

Roadmap
  ├── Monthly
  ├── Weekly
  └── 7-Day

Progress
  ├── Daily
  ├── Weekly
  └── Monthly

Settings
  ├── Profile
  ├── Goals
  ├── Notifications
  ├── Fixed Commitments
  ├── Everyday Activities
  └── Authentication/Security
```

The exact navigation can be refined during UI design.

---

# 33. AI Responsibilities

AI is responsible for:

1. Determining appropriate sleep duration from age.
2. Determining bedtime from wake-up target and sleep requirement.
3. Asking dynamic follow-up questions.
4. Assessing the user's starting point.
5. Breaking goals into tasks.
6. Creating recurring tasks when needed.
7. Determining task duration.
8. Determining schedule placement.
9. Determining dependencies.
10. Creating monthly roadmaps.
11. Creating weekly roadmaps.
12. Creating 7-day plans.
13. Creating the detailed next-day plan.
14. Recalculating affected future schedules after user changes.
15. Determining whether fixed commitments are relevant to goals.
16. Balancing flexible task and activity durations when the day is constrained.

AI does not provide a conversational chat interface.

---

# 34. Core Scheduling Constraints

The scheduler should follow a hierarchy.

## Highest constraint

Fixed commitments.

These cannot move.

## Flexible elements

- Goal tasks
- Everyday activities
- Short breaks

These can be adjusted.

## Planning inputs

The scheduler considers:

- User wake-up preference
- AI-determined bedtime
- Required sleep
- Fixed commitments
- Goal priority
- Task priority
- Task duration
- Dependencies
- Deadlines
- Recurring task requirements
- Available time

---

# 35. Recommended High-Level System Architecture

A suitable architecture can be:

```text
Mobile Browser
      ↓
Frontend Web Application
      ↓
REST API
      ↓
Backend Application
 ┌───────────────┬──────────────────┐
 │ Authentication │ Core Application │
 │ JWT / OTP      │ Goals / Tasks    │
 │ Google OAuth   │ Roadmaps / Stats │
 └───────────────┴──────────────────┘
      ↓
Database
      ↓
AI Planning Service
      ↓
AI Model / LLM Provider

External Services
 ├── Email OTP provider
 ├── SMS OTP provider
 └── Google OAuth
```

The final technology stack should be selected during technical architecture planning.

---

# 36. Suggested Backend Domains

The backend should be separated into logical modules.

Possible modules:

```text
accounts
authentication
users
goals
roadmaps
tasks
scheduling
progress
notifications
analytics
admin
ai
```

This separation supports maintainability and future scaling.

---

# 37. Core Data Entities

Initial entities should include:

## User

- id
- email
- phone
- password hash
- verification status
- authentication provider
- role
- created_at
- last_active_at
- account status

## UserProfile

- user
- age
- preferred wake-up time
- AI-recommended sleep duration
- AI-determined bedtime

## FixedCommitment

- id
- user
- category
- name
- start time
- end time
- recurrence
- active status

## EverydayActivity

- id
- user
- name
- AI-suggested duration
- user-edited duration
- recurrence/availability

## Goal

- id
- user
- name
- priority
- goal type
- deadline
- initial estimate
- AI-assessed starting state
- status

## GoalDependency

- source goal/task
- dependent goal/task

## Task

- id
- goal
- name
- priority
- AI-generated duration
- scheduled duration
- status
- scheduled start
- scheduled end
- recurrence information

## TaskDependency

- task
- dependency

## DailySchedule

- user
- date
- generation version
- status

## ProgressRecord

- user
- goal
- date/week/month
- weighted progress

## NotificationPreference

- user
- task
- enabled

## DailySummary

- user
- date
- completed tasks
- incomplete tasks
- skipped tasks
- weighted progress

---

# 38. MVP Scope

The first production-ready MVP should focus on the core loop.

## Must have

### Authentication

- Email/password + email OTP
- Phone/password + SMS OTP
- Google sign-in
- JWT authentication

### Onboarding

- Age
- Wake-up preference
- AI sleep/bedtime calculation
- Fixed commitments
- Everyday activities
- Unlimited goals
- Goal priorities
- Goal type
- Deadline where required
- Initial goal level
- AI follow-up questions

### Planning

- Monthly roadmap
- Weekly roadmap
- 7-day daily schedule
- Wake-up-to-sleep timeline
- AI-generated tasks
- AI-generated recurring tasks
- Task durations
- Task priorities
- Dependencies
- Fixed commitment locking

### Task management

- Complete
- Incomplete
- Skip
- Reschedule
- Edit duration
- Edit priority

### Progress

- Weighted daily progress
- Weekly progress
- Monthly progress
- Individual goal progress
- Overall monthly progress
- Daily summary

### Notifications

- User-selected task notifications
- Exact task-time notifications
- Automatic update when task time changes

### Admin

- Admin authentication
- Total users
- Active users
- User management
- Basic analytics

### UX

- Mobile-first interface
- Today's Timeline as home screen
- Quick task actions
- Full task details
- Responsive web design

---

# 39. Future Features

Potential future features:

- Calendar integration
- Wearable/device integrations
- Location-aware scheduling
- More advanced productivity analytics
- AI-generated explanations
- Voice input
- Voice assistant
- Smart calendar synchronization
- Team/family planning
- Multiple routine templates
- Offline-first functionality
- Advanced behavioral insights
- Goal recommendation
- Gamification
- Streaks
- Achievement system

These should not distract from the core MVP.

---

# 40. Success Metrics

Potential product metrics:

## Activation

- Percentage of users completing onboarding
- Percentage of users generating their first roadmap
- Time from signup to first generated schedule

## Engagement

- Daily active users
- Weekly active users
- Monthly active users
- Percentage of users returning the next day

## Task usage

- Task completion rate
- Task skip rate
- Task incomplete rate
- Percentage of users completing at least one goal task per day

## Planning quality

- Percentage of generated schedules successfully created
- Number of schedule recalculations
- Percentage of days with no scheduling conflicts

## Goal outcomes

- Goals completed
- Time-bound goals completed before deadline
- Average progress per active goal

---

# 41. Important Product Rules

The following rules are considered core requirements.

1. Users can have unlimited goals.
2. Users manually set goal priority.
3. Users manually set task priority.
4. AI creates goal-related tasks.
5. Users cannot create tasks.
6. Users cannot delete tasks.
7. Users cannot rename tasks.
8. Users can edit task duration.
9. Users can edit task priority.
10. Users can reschedule tasks.
11. Users can skip tasks.
12. Skipped tasks do not reduce progress.
13. Skipped tasks are excluded from progress calculation.
14. Incomplete tasks contribute zero for that task.
15. Completed tasks contribute according to their weight.
16. Fixed commitments cannot be moved by AI.
17. AI can rearrange flexible tasks.
18. AI can reduce task/activity durations when necessary.
19. AI balances reductions between goal tasks and everyday activities.
20. AI does not use energy-level questions for scheduling.
21. AI automatically creates recurring tasks when appropriate.
22. Every task belongs to exactly one goal.
23. AI automatically determines dependencies.
24. Daily schedule covers wake-up to sleep.
25. Normal everyday activities do not contribute to goal progress.
26. AI may classify a fixed commitment as goal-related.
27. AI generates 7 days ahead.
28. Tomorrow receives the most detailed plan.
29. Changes to tasks can trigger immediate recalculation of affected future days.
30. Behavioral patterns do not automatically change future scheduling.
31. AI does not provide a chat interface.
32. Notifications are optional.
33. Users select which tasks receive notifications.
34. Notifications fire at the task's exact scheduled time.
35. Notifications follow the latest scheduled task time.
36. Weekly roadmap generation is automatic.
37. Monthly roadmap generation is automatic.
38. Completed goals have their future tasks removed.
39. Historical progress is retained.
40. The home screen is Today's Timeline.
41. The product is mobile-first.
42. Admin has a separate management interface.

---

# 42. Core User Journey

```text
Sign Up
   ↓
Verify Email / Phone OTP
   ↓
Set Password
   ↓
Basic Information
   ↓
Preferred Wake-up Time
   ↓
AI Determines Sleep Requirement
   ↓
AI Determines Bedtime
   ↓
Fixed Commitments
   ↓
Everyday Activities
   ↓
Goals
   ↓
Goal Priorities
   ↓
Goal Type + Deadline
   ↓
Initial Goal Assessment
   ↓
AI Dynamic Questions
   ↓
AI Determines Starting Point
   ↓
AI Determines Dependencies
   ↓
Generate Monthly Roadmap
   ↓
Generate Weekly Roadmap
   ↓
Generate 7-Day Schedule
   ↓
Open Today's Timeline
   ↓
Complete / Skip / Reschedule Tasks
   ↓
Track Weighted Progress
   ↓
Daily Summary
   ↓
Next Day / Week / Month Automatically Generated
```

---

# 43. Core Product Loop

The most important product loop is:

```text
Understand user
      ↓
Understand goals
      ↓
Generate roadmap
      ↓
Generate daily timeline
      ↓
User executes tasks
      ↓
Track completion
      ↓
Show progress
      ↓
Generate next planning period
      ↓
Repeat
```

The application should remain focused on making this loop simple, reliable, and useful.

---

# 44. Product Experience Statement

The intended user experience is:

> "I tell the app what I want to achieve and what my real life looks like. The app figures out what I need to do and gives me a realistic timeline from the moment I wake up until I go to sleep. I simply follow the plan, complete my tasks, and see my progress."

That is the central product promise.
