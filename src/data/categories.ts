import type { Category } from '../types/category'

export const CATEGORIES: Category[] = [
  {
    id: 'news',
    label: 'News & Current Events',
    icon: '📰',
    description: 'Stay informed with current affairs and world events',
    children: [
      {
        id: 'news-world',
        label: 'World News',
        icon: '🌍',
        description: 'International affairs and global events',
        children: [
          { id: 'news-world-relations', label: 'International Relations', icon: '🤝', description: 'Diplomacy and geopolitics' },
          { id: 'news-world-climate', label: 'Climate & Environment', icon: '🌱', description: 'Environmental news and climate action' },
          { id: 'news-world-human', label: 'Human Interest', icon: '❤️', description: 'Inspiring and impactful human stories' },
        ],
      },
      {
        id: 'news-business',
        label: 'Business & Economy',
        icon: '💼',
        description: 'Market trends and economic developments',
        children: [
          { id: 'news-business-market', label: 'Stock Market', icon: '📈', description: 'Market analysis and trading' },
          { id: 'news-business-startups', label: 'Startups & Innovation', icon: '🚀', description: 'New ventures and disruption' },
          { id: 'news-business-finance', label: 'Personal Finance', icon: '💰', description: 'Money management and investing' },
        ],
      },
      {
        id: 'news-science',
        label: 'Science & Discovery',
        icon: '🔬',
        description: 'Scientific breakthroughs and discoveries',
        children: [
          { id: 'news-science-space', label: 'Space & Astronomy', icon: '🌌', description: 'Space exploration and celestial events' },
          { id: 'news-science-medical', label: 'Medical Breakthroughs', icon: '🏥', description: 'Healthcare advances and research' },
          { id: 'news-science-tech', label: 'AI & Technology', icon: '🤖', description: 'Emerging tech and AI developments' },
        ],
      },
      {
        id: 'news-culture',
        label: 'Culture & Society',
        icon: '🎭',
        description: 'Cultural trends and social movements',
        children: [
          { id: 'news-culture-entertainment', label: 'Entertainment', icon: '🎬', description: 'Movies, shows, and pop culture' },
          { id: 'news-culture-sports', label: 'Sports', icon: '⚽', description: 'Sports news and highlights' },
          { id: 'news-culture-lifestyle', label: 'Lifestyle Trends', icon: '✨', description: 'Fashion, food, and living' },
        ],
      },
    ],
  },
  {
    id: 'tech',
    label: 'Technology',
    icon: '💻',
    description: 'Software, hardware, and digital innovation',
    children: [
      {
        id: 'tech-software',
        label: 'Software Development',
        icon: '⚙️',
        description: 'Programming and software engineering',
        children: [
          { id: 'tech-software-web', label: 'Web Development', icon: '🌐', description: 'Frontend, backend, and full-stack' },
          { id: 'tech-software-mobile', label: 'Mobile Apps', icon: '📱', description: 'iOS, Android, and cross-platform' },
          { id: 'tech-software-devops', label: 'DevOps & Cloud', icon: '☁️', description: 'Infrastructure and deployment' },
        ],
      },
      {
        id: 'tech-ai',
        label: 'AI & Machine Learning',
        icon: '🧠',
        description: 'Artificial intelligence and ML advancements',
        children: [
          { id: 'tech-ai-llm', label: 'Large Language Models', icon: '💬', description: 'ChatGPT, Claude, and LLM tech' },
          { id: 'tech-ai-cv', label: 'Computer Vision', icon: '👁️', description: 'Image recognition and visual AI' },
          { id: 'tech-ai-ethics', label: 'AI Ethics', icon: '⚖️', description: 'Responsible AI and governance' },
        ],
      },
      {
        id: 'tech-consumer',
        label: 'Consumer Tech',
        icon: '📲',
        description: 'Gadgets and consumer electronics',
        children: [
          { id: 'tech-consumer-phones', label: 'Smartphones & Gadgets', icon: '📱', description: 'Device reviews and comparisons' },
          { id: 'tech-consumer-home', label: 'Smart Home', icon: '🏠', description: 'Home automation and IoT' },
          { id: 'tech-consumer-gaming', label: 'Gaming', icon: '🎮', description: 'Games, consoles, and esports' },
        ],
      },
      {
        id: 'tech-security',
        label: 'Cybersecurity',
        icon: '🔒',
        description: 'Digital security and privacy',
        children: [
          { id: 'tech-security-privacy', label: 'Privacy & Data', icon: '🛡️', description: 'Data protection and privacy' },
          { id: 'tech-security-threats', label: 'Hacking & Threats', icon: '⚠️', description: 'Cyber threats and incidents' },
          { id: 'tech-security-compliance', label: 'Compliance', icon: '📋', description: 'Regulations and standards' },
        ],
      },
    ],
  },
  {
    id: 'health',
    label: 'Health & Fitness',
    icon: '💪',
    description: 'Physical and mental wellbeing',
    children: [
      {
        id: 'health-exercise',
        label: 'Exercise & Training',
        icon: '🏋️',
        description: 'Workout routines and fitness tips',
        children: [
          { id: 'health-exercise-strength', label: 'Strength Training', icon: '💪', description: 'Weightlifting and resistance' },
          { id: 'health-exercise-cardio', label: 'Running & Cardio', icon: '🏃', description: 'Endurance and cardiovascular' },
          { id: 'health-exercise-yoga', label: 'Yoga & Flexibility', icon: '🧘', description: 'Stretching and mindful movement' },
        ],
      },
      {
        id: 'health-nutrition',
        label: 'Nutrition',
        icon: '🥗',
        description: 'Diet and nutritional science',
        children: [
          { id: 'health-nutrition-meal', label: 'Meal Planning', icon: '🍽️', description: 'Recipes and meal prep' },
          { id: 'health-nutrition-supplements', label: 'Supplements', icon: '💊', description: 'Vitamins and supplements' },
          { id: 'health-nutrition-trends', label: 'Dietary Trends', icon: '🌿', description: 'Keto, vegan, intermittent fasting' },
        ],
      },
      {
        id: 'health-mental',
        label: 'Mental Health',
        icon: '🧠',
        description: 'Psychological wellbeing and self-care',
        children: [
          { id: 'health-mental-stress', label: 'Stress Management', icon: '😌', description: 'Coping and relaxation techniques' },
          { id: 'health-mental-sleep', label: 'Sleep & Recovery', icon: '😴', description: 'Sleep hygiene and rest' },
          { id: 'health-mental-mindfulness', label: 'Mindfulness', icon: '🕊️', description: 'Meditation and awareness' },
        ],
      },
      {
        id: 'health-medical',
        label: 'Medical Knowledge',
        icon: '🏥',
        description: 'Health literacy and medical awareness',
        children: [
          { id: 'health-medical-conditions', label: 'Common Conditions', icon: '🩺', description: 'Understanding illnesses' },
          { id: 'health-medical-preventive', label: 'Preventive Care', icon: '💉', description: 'Checkups and prevention' },
          { id: 'health-medical-firstaid', label: 'First Aid', icon: '🚑', description: 'Emergency response basics' },
        ],
      },
    ],
  },
  {
    id: 'daily',
    label: 'Daily Life & Social',
    icon: '🗣️',
    description: 'Everyday conversations and social situations',
    children: [
      {
        id: 'daily-workplace',
        label: 'Workplace Communication',
        icon: '🏢',
        description: 'Professional interactions and office talk',
        children: [
          { id: 'daily-workplace-meetings', label: 'Meetings & Presentations', icon: '📊', description: 'Leading and participating in meetings' },
          { id: 'daily-workplace-email', label: 'Email & Written Comms', icon: '📧', description: 'Professional writing and messages' },
          { id: 'daily-workplace-networking', label: 'Small Talk & Networking', icon: '🤝', description: 'Building professional relationships' },
        ],
      },
      {
        id: 'daily-travel',
        label: 'Travel & Adventure',
        icon: '✈️',
        description: 'Travel situations and exploration',
        children: [
          { id: 'daily-travel-airport', label: 'Airport & Hotel', icon: '🏨', description: 'Check-in, boarding, and accommodation' },
          { id: 'daily-travel-dining', label: 'Dining & Ordering', icon: '🍕', description: 'Restaurants and food ordering' },
          { id: 'daily-travel-directions', label: 'Directions & Transport', icon: '🚇', description: 'Getting around and navigation' },
        ],
      },
      {
        id: 'daily-shopping',
        label: 'Shopping & Services',
        icon: '🛍️',
        description: 'Consumer interactions and services',
        children: [
          { id: 'daily-shopping-online', label: 'Online Shopping', icon: '🛒', description: 'E-commerce and delivery' },
          { id: 'daily-shopping-returns', label: 'Returns & Complaints', icon: '📞', description: 'Customer service interactions' },
          { id: 'daily-shopping-appointments', label: 'Appointments & Reservations', icon: '📅', description: 'Booking and scheduling' },
        ],
      },
      {
        id: 'daily-social',
        label: 'Relationships & Social',
        icon: '👥',
        description: 'Personal relationships and social life',
        children: [
          { id: 'daily-social-friends', label: 'Making Friends', icon: '🫂', description: 'Social skills and friendship' },
          { id: 'daily-social-family', label: 'Family & Parenting', icon: '👨‍👩‍👧', description: 'Family dynamics and parenting' },
          { id: 'daily-social-conflict', label: 'Conflict Resolution', icon: '🕊️', description: 'Handling disagreements gracefully' },
        ],
      },
    ],
  },
  {
    id: 'academic',
    label: 'Academic & Professional',
    icon: '🎓',
    description: 'Academic and career advancement',
    children: [
      {
        id: 'academic-research',
        label: 'Research & Writing',
        icon: '📝',
        description: 'Academic and research communication',
        children: [
          { id: 'academic-research-papers', label: 'Academic Papers', icon: '📄', description: 'Research paper writing' },
          { id: 'academic-research-review', label: 'Literature Review', icon: '📚', description: 'Analyzing existing research' },
          { id: 'academic-research-data', label: 'Data Presentation', icon: '📊', description: 'Presenting findings effectively' },
        ],
      },
      {
        id: 'academic-speaking',
        label: 'Public Speaking',
        icon: '🎤',
        description: 'Presentation and speaking skills',
        children: [
          { id: 'academic-speaking-conference', label: 'Conference Talks', icon: '🏛️', description: 'Academic and industry talks' },
          { id: 'academic-speaking-pitch', label: 'Pitch Presentations', icon: '🎯', description: 'Persuasive pitching' },
          { id: 'academic-speaking-panel', label: 'Panel Discussions', icon: '👥', description: 'Group discussions and debates' },
        ],
      },
      {
        id: 'academic-career',
        label: 'Job & Career',
        icon: '💼',
        description: 'Career development and job hunting',
        children: [
          { id: 'academic-career-interview', label: 'Interviews', icon: '🤵', description: 'Job interview preparation' },
          { id: 'academic-career-resume', label: 'Resume & Cover Letter', icon: '📋', description: 'Application materials' },
          { id: 'academic-career-salary', label: 'Salary Negotiation', icon: '💵', description: 'Compensation discussions' },
        ],
      },
      {
        id: 'academic-legal',
        label: 'Legal & Formal',
        icon: '⚖️',
        description: 'Legal and formal communication',
        children: [
          { id: 'academic-legal-contracts', label: 'Contracts & Agreements', icon: '📜', description: 'Legal document language' },
          { id: 'academic-legal-correspondence', label: 'Formal Correspondence', icon: '✉️', description: 'Official letters and communication' },
          { id: 'academic-legal-regulatory', label: 'Regulatory Language', icon: '🏛️', description: 'Compliance and regulations' },
        ],
      },
    ],
  },
  {
    id: 'entertainment',
    label: 'Entertainment & Culture',
    icon: '🎭',
    description: 'Arts, media, and cultural topics',
    children: [
      {
        id: 'entertainment-movies',
        label: 'Movies & TV',
        icon: '🎬',
        description: 'Film and television discussion',
        children: [
          { id: 'entertainment-movies-reviews', label: 'Reviews & Opinions', icon: '⭐', description: 'Critiquing and discussing media' },
          { id: 'entertainment-movies-plot', label: 'Plot Discussion', icon: '📖', description: 'Story analysis and theories' },
          { id: 'entertainment-movies-bts', label: 'Behind the Scenes', icon: '🎥', description: 'Production and filmmaking' },
        ],
      },
      {
        id: 'entertainment-music',
        label: 'Music & Arts',
        icon: '🎵',
        description: 'Music, visual arts, and performance',
        children: [
          { id: 'entertainment-music-discussion', label: 'Music Discussion', icon: '🎧', description: 'Genre and artist discussion' },
          { id: 'entertainment-music-visual', label: 'Visual Arts', icon: '🎨', description: 'Painting, sculpture, and design' },
          { id: 'entertainment-music-performance', label: 'Performance Arts', icon: '💃', description: 'Theater, dance, and live arts' },
        ],
      },
      {
        id: 'entertainment-books',
        label: 'Books & Literature',
        icon: '📚',
        description: 'Reading and literary discussion',
        children: [
          { id: 'entertainment-books-fiction', label: 'Fiction Discussion', icon: '📕', description: 'Novels and short stories' },
          { id: 'entertainment-books-nonfiction', label: 'Non-fiction Reviews', icon: '📘', description: 'Informational and educational' },
          { id: 'entertainment-books-poetry', label: 'Poetry & Prose', icon: '✍️', description: 'Poetic and lyrical writing' },
        ],
      },
      {
        id: 'entertainment-food',
        label: 'Food & Cooking',
        icon: '🍳',
        description: 'Culinary arts and food culture',
        children: [
          { id: 'entertainment-food-recipes', label: 'Recipes & Techniques', icon: '👨‍🍳', description: 'Cooking methods and recipes' },
          { id: 'entertainment-food-restaurant', label: 'Restaurant Culture', icon: '🍽️', description: 'Dining experiences and reviews' },
          { id: 'entertainment-food-science', label: 'Food Science', icon: '🔬', description: 'Science of cooking and flavor' },
        ],
      },
    ],
  },
]

export function findCategory(id: string, cats: Category[] = CATEGORIES): Category | undefined {
  for (const cat of cats) {
    if (cat.id === id) return cat
    if (cat.children) {
      const found = findCategory(id, cat.children)
      if (found) return found
    }
  }
  return undefined
}

export function getAllLeafCategories(cats: Category[] = CATEGORIES): Category[] {
  const leaves: Category[] = []
  for (const cat of cats) {
    if (!cat.children || cat.children.length === 0) {
      leaves.push(cat)
    } else {
      leaves.push(...getAllLeafCategories(cat.children))
    }
  }
  return leaves
}
