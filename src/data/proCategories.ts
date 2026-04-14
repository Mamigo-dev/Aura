import type { Category } from '../types/category'

export const PRO_CATEGORIES: Category[] = [
  {
    id: 'freeze',
    label: 'Scenes You Freeze In',
    icon: '🔥',
    description: 'High-pressure moments where you go blank (anxiety level 5)',
    children: [
      {
        id: 'meeting_ambush',
        label: 'Meeting Ambush',
        icon: '😶',
        description: 'Suddenly asked to speak unprepared in a meeting',
      },
      {
        id: 'after_work_drinks',
        label: 'After-Work Drinks',
        icon: '🍻',
        description: 'Casual socializing with colleagues outside the office',
      },
      {
        id: 'one_on_one_boss',
        label: '1:1 with Boss',
        icon: '👔',
        description: 'Informal chat with your manager, not a technical review',
      },
      {
        id: 'interview_curveball',
        label: 'Interview Curveball',
        icon: '🎯',
        description: 'Unexpected personal questions in job interviews',
      },
    ],
  },
  {
    id: 'avoiding',
    label: 'Things You Avoid',
    icon: '😰',
    description: 'Situations you dodge or do via text instead (anxiety level 4)',
    children: [
      {
        id: 'making_phone_calls',
        label: 'Making Phone Calls',
        icon: '📞',
        description: 'Calling instead of texting or emailing',
      },
      {
        id: 'explaining_work_simply',
        label: 'Explaining Your Work Simply',
        icon: '🗣️',
        description: 'Describing your job to non-tech people',
      },
      {
        id: 'disagreeing',
        label: 'Disagreeing Diplomatically',
        icon: '🤔',
        description: 'Pushing back on ideas without being rude',
      },
      {
        id: 'apologizing',
        label: 'Apologizing Naturally',
        icon: '🙏',
        description: 'Admitting mistakes without over-formality',
      },
    ],
  },
  {
    id: 'robotic',
    label: 'Sounds Robotic',
    icon: '🎯',
    description: 'You do it, but sound stiff and overly formal (anxiety level 3)',
    children: [
      {
        id: 'slack_messages',
        label: 'Slack Messages',
        icon: '💬',
        description: 'Too formal for casual team chat',
      },
      {
        id: 'email_tone',
        label: 'Email Openings & Closings',
        icon: '📧',
        description: 'Moving beyond "Dear Sir/Madam" and "Kind regards"',
      },
      {
        id: 'giving_compliments',
        label: 'Giving Compliments',
        icon: '👏',
        description: 'Natural praise and thanks that sound genuine',
      },
      {
        id: 'providing_feedback',
        label: 'Providing Feedback',
        icon: '📝',
        description: 'Constructive but not corporate-speak',
      },
    ],
  },
  {
    id: 'daily_life',
    label: 'Daily Life',
    icon: '💬',
    description: 'Everyday situations you want to handle naturally (anxiety level 2)',
    children: [
      {
        id: 'coffee_shop',
        label: 'Coffee Shop & Restaurants',
        icon: '☕',
        description: 'Ordering, chatting with staff, making small requests',
      },
      {
        id: 'chatting_neighbors',
        label: 'Chatting with Neighbors',
        icon: '🏘️',
        description: 'Casual community interactions and small talk',
      },
      {
        id: 'doctor_visits',
        label: 'Doctor Visits',
        icon: '🩺',
        description: 'Describing symptoms naturally without clinical jargon',
      },
      {
        id: 'parent_teacher',
        label: 'Parent-Teacher Conferences',
        icon: '🏫',
        description: 'School interactions about your child',
      },
    ],
  },
  {
    id: 'confident_speaking',
    label: 'Confident Speaking',
    icon: '🎤',
    description: 'Public situations where you want to shine (anxiety level 1)',
    children: [
      {
        id: 'conference_qa',
        label: 'Conference Q&A',
        icon: '🎙️',
        description: 'Answering unexpected questions after a talk',
      },
      {
        id: 'team_standup',
        label: 'Team Standup',
        icon: '🧍',
        description: 'Casual daily updates without sounding scripted',
      },
      {
        id: 'pitch_improv',
        label: 'Pitch with Improvisation',
        icon: '🎪',
        description: 'Going off-script and handling surprises',
      },
      {
        id: 'panel_discussion',
        label: 'Panel Discussion',
        icon: '👥',
        description: 'Multi-person debate and dialogue',
      },
    ],
  },
]
