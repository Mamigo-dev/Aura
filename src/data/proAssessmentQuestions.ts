import type { ImbalanceDimension } from '../types/professional'

export type ProQuestionType = 'multiple_choice' | 'rewrite' | 'respond'

export interface ProAssessmentQuestion {
  id: string
  dimension: ImbalanceDimension
  type: ProQuestionType
  prompt: string
  // For multiple_choice:
  options?: { text: string; formality: 'formal' | 'natural' | 'casual' | 'wrong' }[]
  correctIndex?: number
  // For rewrite:
  formalInput?: string
  // For respond:
  scenario?: string
}

export const PRO_ASSESSMENT_QUESTIONS: ProAssessmentQuestion[] = [
  // ── technicalWriting (2, expected high — confirm strength) ──

  {
    id: 'tw-1',
    dimension: 'technicalWriting',
    type: 'multiple_choice',
    prompt: 'What does "refactoring" mean in software engineering?',
    options: [
      { text: 'Rewriting code to improve structure without changing behavior', formality: 'natural' },
      { text: 'Adding new features to existing code', formality: 'wrong' },
      { text: 'Deleting unused code from the repository', formality: 'wrong' },
      { text: 'Converting code to a different programming language', formality: 'wrong' },
    ],
    correctIndex: 0,
  },
  {
    id: 'tw-2',
    dimension: 'technicalWriting',
    type: 'multiple_choice',
    prompt: 'Which opening is most appropriate for a research paper abstract?',
    options: [
      { text: 'So basically what we did was...', formality: 'casual' },
      { text: 'This paper presents a novel approach to distributed consensus that reduces message complexity from O(n²) to O(n log n).', formality: 'formal' },
      { text: 'Hey, we found something cool about distributed systems.', formality: 'casual' },
      { text: 'In this document I will talk about some things related to computer science.', formality: 'wrong' },
    ],
    correctIndex: 1,
  },

  // ── academicReading (2, expected high) ──

  {
    id: 'ar-1',
    dimension: 'academicReading',
    type: 'multiple_choice',
    prompt: 'Read: "The epistemological implications of quantum indeterminacy challenge the foundational assumptions of classical realism, suggesting that observation is not merely passive but constitutive of the phenomena it purports to describe." What is the main claim?',
    options: [
      { text: 'Quantum physics proves that reality does not exist', formality: 'wrong' },
      { text: 'Classical realism is the best framework for understanding quantum mechanics', formality: 'wrong' },
      { text: 'Observation in quantum mechanics actively shapes what is being observed, undermining classical assumptions', formality: 'natural' },
      { text: 'Epistemology and quantum physics are unrelated fields', formality: 'wrong' },
    ],
    correctIndex: 2,
  },
  {
    id: 'ar-2',
    dimension: 'academicReading',
    type: 'multiple_choice',
    prompt: 'Read: "While correlation does not imply causation, the robust association between sleep duration and cognitive performance, controlling for confounding variables, warrants further investigation through randomized controlled trials." What is the author recommending?',
    options: [
      { text: 'That we should all sleep more to be smarter', formality: 'wrong' },
      { text: 'That the link between sleep and cognition is definitively proven', formality: 'wrong' },
      { text: 'That more rigorous experimental studies are needed to establish a causal relationship', formality: 'natural' },
      { text: 'That correlation always implies causation when variables are controlled', formality: 'wrong' },
    ],
    correctIndex: 2,
  },

  // ── casualConversation (3, the core weakness) ──

  {
    id: 'cc-1',
    dimension: 'casualConversation',
    type: 'multiple_choice',
    prompt: 'Your coworker walks past and says "What\'s up?" Which response is most natural?',
    options: [
      { text: 'I am doing well, thank you for inquiring. And yourself?', formality: 'formal' },
      { text: 'The ceiling, technically speaking.', formality: 'wrong' },
      { text: 'Not much, you?', formality: 'natural' },
      { text: 'I am currently proceeding to the break room to acquire a beverage.', formality: 'formal' },
    ],
    correctIndex: 2,
  },
  {
    id: 'cc-2',
    dimension: 'casualConversation',
    type: 'respond',
    prompt: 'Your coworker asks "Got any plans this weekend?" Type a natural, casual response.',
    scenario: 'You are at your desk. A friendly colleague stops by and asks about your weekend. You are thinking of maybe hiking or just relaxing at home.',
  },
  {
    id: 'cc-3',
    dimension: 'casualConversation',
    type: 'multiple_choice',
    prompt: 'A colleague says: "I\'m gonna grab lunch, wanna come?" What do "gonna" and "wanna" mean here?',
    options: [
      { text: 'They are grammatically incorrect and should be avoided', formality: 'wrong' },
      { text: '"Going to" and "want to" — standard casual contractions in spoken English', formality: 'natural' },
      { text: 'Slang that only young people use', formality: 'wrong' },
      { text: 'Informal words that are rude to use at work', formality: 'wrong' },
    ],
    correctIndex: 1,
  },

  // ── socialSmallTalk (3) ──

  {
    id: 'sst-1',
    dimension: 'socialSmallTalk',
    type: 'multiple_choice',
    prompt: 'At a company event, someone asks "So what do you do?" Pick the most natural response.',
    options: [
      { text: 'I am a senior software engineer specializing in distributed systems and microservice architectures with 8 years of industry experience.', formality: 'formal' },
      { text: 'I\'m a software engineer — I mostly work on backend stuff, making sure our systems can handle lots of users.', formality: 'natural' },
      { text: 'I write code.', formality: 'casual' },
      { text: 'My professional responsibilities encompass the design and implementation of scalable software solutions.', formality: 'formal' },
    ],
    correctIndex: 1,
  },
  {
    id: 'sst-2',
    dimension: 'socialSmallTalk',
    type: 'respond',
    prompt: 'You\'re in the elevator with a colleague you don\'t know well. They say "Crazy weather today, huh?" Type a natural response that keeps the conversation going.',
    scenario: 'Monday morning, it has been raining heavily all weekend. You are both heading to the same floor. The elevator ride is about 30 seconds.',
  },
  {
    id: 'sst-3',
    dimension: 'socialSmallTalk',
    type: 'multiple_choice',
    prompt: 'You need to leave a conversation at a networking event. Which exit is most natural?',
    options: [
      { text: 'I must take my leave now. It was a pleasure to make your acquaintance.', formality: 'formal' },
      { text: 'Bye.', formality: 'casual' },
      { text: 'Anyway, I\'m gonna grab another drink — really nice chatting with you though!', formality: 'natural' },
      { text: 'I hereby conclude our conversation. Farewell.', formality: 'formal' },
    ],
    correctIndex: 2,
  },

  // ── impromptuSpeaking (2) ──

  {
    id: 'is-1',
    dimension: 'impromptuSpeaking',
    type: 'respond',
    prompt: 'Your boss suddenly asks "What do you think about this idea?" in a meeting. You have mixed feelings about it. Type what you\'d actually say.',
    scenario: 'The team is discussing a proposal to rewrite the frontend in a new framework. Your boss just pitched it enthusiastically. You think it has some merit but the timeline is unrealistic and migration risks are high. The whole team is looking at you.',
  },
  {
    id: 'is-2',
    dimension: 'impromptuSpeaking',
    type: 'multiple_choice',
    prompt: 'You\'re asked to introduce yourself at a team event. Which version sounds most natural?',
    options: [
      { text: 'Good evening, esteemed colleagues. My name is [Name] and I have been employed at this organization for approximately two years in the capacity of a software engineer.', formality: 'formal' },
      { text: 'Hey everyone! I\'m [Name], been on the platform team about two years now. Outside of work I\'m really into hiking and bad sci-fi movies.', formality: 'natural' },
      { text: 'Yo, I\'m [Name]. I do computer stuff.', formality: 'casual' },
      { text: 'I would like to introduce myself. I am [Name]. I perform software engineering tasks.', formality: 'formal' },
    ],
    correctIndex: 1,
  },

  // ── humorSarcasm (2) ──

  {
    id: 'hs-1',
    dimension: 'humorSarcasm',
    type: 'multiple_choice',
    prompt: 'Your colleague says: "Oh great, another meeting about meetings." What do they mean?',
    options: [
      { text: 'They are excited about the upcoming meeting', formality: 'wrong' },
      { text: 'They are being sarcastic — they think there are too many unnecessary meetings', formality: 'natural' },
      { text: 'They want to organize more meetings', formality: 'wrong' },
      { text: 'They are confused about the meeting schedule', formality: 'wrong' },
    ],
    correctIndex: 1,
  },
  {
    id: 'hs-2',
    dimension: 'humorSarcasm',
    type: 'multiple_choice',
    prompt: 'Before your demo, a teammate says: "No pressure, but the CEO is watching your demo." Is this sincere or humorous?',
    options: [
      { text: 'Completely sincere — they are warning you to be careful', formality: 'wrong' },
      { text: 'Humorous — they are playfully acknowledging the pressure while trying to lighten the mood', formality: 'natural' },
      { text: 'Rude — they are trying to make you nervous on purpose', formality: 'wrong' },
      { text: 'Irrelevant — the CEO watching does not matter', formality: 'wrong' },
    ],
    correctIndex: 1,
  },

  // ── registerFlexibility (3) ──

  {
    id: 'rf-1',
    dimension: 'registerFlexibility',
    type: 'rewrite',
    prompt: 'Rewrite this for a Slack message to a friendly colleague:',
    formalInput: 'I would like to express my gratitude for your assistance in resolving the aforementioned issue. Your expertise was instrumental in achieving a satisfactory outcome.',
  },
  {
    id: 'rf-2',
    dimension: 'registerFlexibility',
    type: 'rewrite',
    prompt: 'How would you tell your non-tech friend about this?',
    formalInput: 'The system is experiencing intermittent connectivity failures due to DNS resolution timeouts propagating through the service mesh.',
  },
  {
    id: 'rf-3',
    dimension: 'registerFlexibility',
    type: 'multiple_choice',
    prompt: 'Which response is most appropriate for a casual Slack message to your team after fixing a bug?',
    options: [
      { text: 'Dear Team, I am pleased to inform you that the defect has been rectified. Please verify at your earliest convenience.', formality: 'formal' },
      { text: 'Fixed that bug 🎉 Should be good now — let me know if you see anything weird.', formality: 'natural' },
      { text: 'The identified software anomaly has been resolved per standard remediation procedures. Kindly confirm functionality.', formality: 'formal' },
      { text: 'bug dead lol', formality: 'casual' },
    ],
    correctIndex: 1,
  },

  // ── culturalReferences (2) ──

  {
    id: 'cr-1',
    dimension: 'culturalReferences',
    type: 'multiple_choice',
    prompt: 'In a meeting, your tech lead says: "Let\'s not reinvent the wheel here." What does this mean?',
    options: [
      { text: 'We should not create new inventions', formality: 'wrong' },
      { text: 'We should use an existing solution instead of building something from scratch', formality: 'natural' },
      { text: 'We need to improve our manufacturing process', formality: 'wrong' },
      { text: 'Wheels are an outdated technology', formality: 'wrong' },
    ],
    correctIndex: 1,
  },
  {
    id: 'cr-2',
    dimension: 'culturalReferences',
    type: 'multiple_choice',
    prompt: 'During a video call, someone says: "Can we take this offline?" In a meeting context, this means:',
    options: [
      { text: 'We should disconnect from the internet', formality: 'wrong' },
      { text: 'We should continue this discussion separately, outside this meeting', formality: 'natural' },
      { text: 'We should print out the documents', formality: 'wrong' },
      { text: 'The Wi-Fi is not working', formality: 'wrong' },
    ],
    correctIndex: 1,
  },
]
