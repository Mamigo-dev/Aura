export interface AssessmentQuestion {
  id: string
  category: 'technical_vocab' | 'daily_expressions' | 'grammar' | 'idioms' | 'comprehension'
  question: string
  options: string[]
  correctIndex: number
  difficulty: 'easy' | 'medium' | 'hard'
}

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  // Technical Vocabulary (expected high for target audience)
  {
    id: 'tv1',
    category: 'technical_vocab',
    question: 'What does "API" stand for in software development?',
    options: ['Application Programming Interface', 'Advanced Protocol Integration', 'Automated Process Instruction', 'Application Process Input'],
    correctIndex: 0,
    difficulty: 'easy',
  },
  {
    id: 'tv2',
    category: 'technical_vocab',
    question: 'Which term describes a function that calls itself?',
    options: ['Iteration', 'Recursion', 'Delegation', 'Compilation'],
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    id: 'tv3',
    category: 'technical_vocab',
    question: 'What is "latency" in the context of network performance?',
    options: ['Data capacity', 'Transfer speed', 'Time delay in communication', 'Signal strength'],
    correctIndex: 2,
    difficulty: 'medium',
  },

  // Daily Expressions (expected weakness for target audience)
  {
    id: 'de1',
    category: 'daily_expressions',
    question: 'Someone says "I\'m under the weather." What do they mean?',
    options: ['They are outdoors', 'They feel sick', 'They are cold', 'They are sad about the weather'],
    correctIndex: 1,
    difficulty: 'easy',
  },
  {
    id: 'de2',
    category: 'daily_expressions',
    question: 'At a coffee shop, what does "Could I get that for here?" mean?',
    options: ['I want a discount', 'I want to drink it in the shop', 'I want it delivered here', 'I want it as a gift'],
    correctIndex: 1,
    difficulty: 'easy',
  },
  {
    id: 'de3',
    category: 'daily_expressions',
    question: 'What is the best response when someone says "How\'s it going?"',
    options: ['Where is it going?', 'It\'s going to work', 'Not bad, thanks! How about you?', 'I don\'t know where'],
    correctIndex: 2,
    difficulty: 'easy',
  },
  {
    id: 'de4',
    category: 'daily_expressions',
    question: 'What does "Let me sleep on it" mean?',
    options: ['I want to go to bed', 'I need more time to decide', 'I will dream about it', 'I\'m tired of discussing this'],
    correctIndex: 1,
    difficulty: 'medium',
  },

  // Grammar
  {
    id: 'g1',
    category: 'grammar',
    question: 'Choose the correct sentence:',
    options: ['If I would have known, I would have come.', 'If I had known, I would have come.', 'If I have known, I would come.', 'If I knew, I would have came.'],
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    id: 'g2',
    category: 'grammar',
    question: 'Which sentence uses the correct article?',
    options: ['She is an university student.', 'She is a university student.', 'She is the university student.', 'She is university student.'],
    correctIndex: 1,
    difficulty: 'easy',
  },
  {
    id: 'g3',
    category: 'grammar',
    question: 'Choose the correct option: "Neither the manager nor the employees ___ available."',
    options: ['is', 'are', 'was', 'being'],
    correctIndex: 1,
    difficulty: 'hard',
  },

  // Idioms
  {
    id: 'i1',
    category: 'idioms',
    question: 'What does "break the ice" mean?',
    options: ['To destroy something frozen', 'To start a conversation in a social setting', 'To break a promise', 'To reveal a secret'],
    correctIndex: 1,
    difficulty: 'easy',
  },
  {
    id: 'i2',
    category: 'idioms',
    question: 'What does "the ball is in your court" mean?',
    options: ['You need to play sports', 'It\'s your turn to take action', 'You need to go to court', 'The game is over'],
    correctIndex: 1,
    difficulty: 'medium',
  },
  {
    id: 'i3',
    category: 'idioms',
    question: 'What does "burning the midnight oil" mean?',
    options: ['Wasting energy', 'Working late into the night', 'Cooking at midnight', 'Being angry at night'],
    correctIndex: 1,
    difficulty: 'medium',
  },

  // Comprehension
  {
    id: 'c1',
    category: 'comprehension',
    question: 'Read: "Despite the initial setback, the team rallied and delivered the project ahead of schedule." What happened?',
    options: ['The project failed', 'The team gave up after a problem', 'The team overcame a problem and finished early', 'The schedule was extended'],
    correctIndex: 2,
    difficulty: 'medium',
  },
  {
    id: 'c2',
    category: 'comprehension',
    question: '"The CEO\'s decision to pivot was met with skepticism, but the quarterly results vindicated her strategy." What does this mean?',
    options: ['The CEO failed', 'People doubted the CEO but the results proved her right', 'The quarterly results were bad', 'The CEO was fired'],
    correctIndex: 1,
    difficulty: 'hard',
  },
]
