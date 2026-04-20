import { useState, useCallback, useMemo, type ReactNode } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { GradientText } from '../components/ui/GradientText'
import { Modal } from '../components/ui/Modal'
import { useSpeechSynthesis } from '../components/speech/useSpeechSynthesis'
import { useUserStore } from '../stores/userStore'
import { getActiveAI, getEffectiveKey } from '../lib/ai-status'
import { callAIDirect, parseAIJSON } from '../api/directAI'
import { generateStoryFromBrave } from '../lib/braveSearch'

// --- Types ---

interface TrendingWord {
  word: string
  definition: string
  pronunciation: string
  examples: [string, string]
}

interface Story {
  id: string
  title: string
  category: string
  content: string
  trendingWords: TrendingWord[]
  isFresh?: boolean
  sources?: { title: string; url: string }[]
}

const CATEGORY_QUERIES: { label: string; query: string }[] = [
  { label: 'Tech', query: 'latest technology trends this week' },
  { label: 'Business', query: 'trending business news this week' },
  { label: 'Science', query: 'recent scientific discoveries this week' },
  { label: 'Health', query: 'health and wellness trends this week' },
  { label: 'Culture', query: 'popular culture trends this week' },
  { label: 'Workplace', query: 'workplace and career trends this week' },
]

// --- Sample Data ---

const SAMPLE_STORIES: Story[] = [
  {
    id: 'story-1',
    title: 'The AI Revolution at Home',
    category: 'Tech',
    content:
      'Smart home technology has evolved far beyond simple voice assistants and programmable thermostats. Today, the concept of ambient computing is reshaping how we interact with our living spaces. Instead of actively commanding devices, our homes are learning to anticipate our needs through subtle environmental cues and behavioral patterns.\n\nAt the heart of this transformation lies edge processing, a paradigm shift that keeps data computation local rather than sending everything to distant cloud servers. Your smart refrigerator no longer needs to phone home to recognize that you are running low on milk. The processing happens right there, on the device itself, making responses faster and your personal data more secure.\n\nPerhaps the most fascinating development is the rise of the digital twin. Imagine a perfect virtual replica of your entire home, continuously updated in real time. This digital twin can simulate energy usage, predict maintenance needs, and even suggest furniture arrangements for optimal natural lighting. Homeowners can test renovations virtually before committing to a single hammer swing.\n\nThese three pillars of modern smart homes are converging to create living environments that feel less like collections of gadgets and more like thoughtful, responsive companions. The future of domestic life is not about having more technology but about technology that fades seamlessly into the background of daily experience.',
    trendingWords: [
      {
        word: 'ambient computing',
        definition:
          'A model of computing where technology is embedded into the environment and responds to people naturally without requiring direct interaction.',
        pronunciation: '/\u02C8\u00E6m.bi.\u0259nt k\u0259m\u02C8pju\u02D0.t\u026A\u014B/',
        examples: [
          'Ambient computing allows your lights to adjust automatically based on the time of day.',
          'The vision of ambient computing is a world where screens disappear and technology just works around you.',
        ],
      },
      {
        word: 'edge processing',
        definition:
          'Computing that takes place at or near the source of data rather than relying on a centralized data center.',
        pronunciation: '/\u025Bd\u0292 \u02C8pr\u0252s.\u025Bs.\u026A\u014B/',
        examples: [
          'Edge processing reduces latency because data does not have to travel to a remote server.',
          'Security cameras with edge processing can identify objects without an internet connection.',
        ],
      },
      {
        word: 'digital twin',
        definition:
          'A virtual representation of a physical object, process, or system that is updated in real time with data from its real-world counterpart.',
        pronunciation: '/\u02C8d\u026Ad\u0292.\u026A.t\u0259l tw\u026An/',
        examples: [
          'Engineers used a digital twin of the bridge to simulate stress before construction began.',
          'The hospital created a digital twin of the patient to model treatment outcomes.',
        ],
      },
    ],
  },
  {
    id: 'story-2',
    title: 'The New Coffee Culture',
    category: 'Daily Life',
    content:
      'Coffee culture has undergone a quiet revolution in cities around the world. Walk into any specialty cafe today and you will find baristas who speak about beans with the same reverence sommeliers reserve for fine wines. At the center of this movement is single origin coffee, beans sourced from one specific farm or region rather than blended from multiple locations.\n\nThe appeal of single origin lies in traceability and flavor distinction. A washed Ethiopian Yirgacheffe tastes nothing like a natural Brazilian Cerrado, and devoted coffee drinkers have learned to appreciate these differences. This shift has created direct trade relationships between roasters and farmers, often improving livelihoods in producing communities.\n\nBrewing methods have changed as well. The pour-over technique, once seen as an impractical hipster ritual, has become a staple. Pouring hot water in slow, concentric circles over freshly ground beans produces a remarkably clean cup that highlights delicate flavor notes. Cafes now offer pour-over bars alongside their espresso machines.\n\nMeanwhile, cold brew has moved from niche curiosity to mainstream essential. Steeped slowly for twelve to twenty-four hours, the resulting concentrate is smooth, low in acidity, and endlessly versatile. You will find it on tap at coffee shops, in cans at grocery stores, and even in cocktail recipes at upscale bars.',
    trendingWords: [
      {
        word: 'single origin',
        definition:
          'Coffee sourced from a single producer, crop, or region within one country, allowing the unique characteristics of that place to shine through.',
        pronunciation: '/\u02C8s\u026A\u014B.\u0261\u0259l \u02C8\u0252r.\u026A.d\u0292\u026An/',
        examples: [
          'This single origin roast from Guatemala has notes of chocolate and citrus.',
          'Many specialty shops now label their single origin beans with the exact farm name.',
        ],
      },
      {
        word: 'pour-over',
        definition:
          'A manual coffee brewing method where hot water is poured slowly over ground coffee in a filter, allowing it to drip through by gravity.',
        pronunciation: '/p\u0254\u02D0r \u02C8o\u028A.v\u0259r/',
        examples: [
          'She prefers a pour-over in the morning because it produces a cleaner taste than a French press.',
          'The barista demonstrated the pour-over technique with a gooseneck kettle.',
        ],
      },
      {
        word: 'cold brew',
        definition:
          'Coffee made by steeping coarsely ground beans in cold or room-temperature water for an extended period, typically twelve to twenty-four hours.',
        pronunciation: '/ko\u028Ald bru\u02D0/',
        examples: [
          'Cold brew is naturally less acidic, making it easier on the stomach.',
          'He keeps a pitcher of cold brew concentrate in the fridge all summer.',
        ],
      },
    ],
  },
  {
    id: 'story-3',
    title: 'Future of Remote Work',
    category: 'Workplace',
    content:
      'The global experiment with remote work has produced a permanent shift in how companies operate. What started as an emergency response has matured into a deliberate strategy, and one concept sits at the core of this new paradigm: asynchronous communication. Instead of requiring everyone to be online at the same time, teams now write detailed updates, record video messages, and document decisions so colleagues in different time zones can engage when it suits them best.\n\nThis asynchronous approach has unlocked a lifestyle that was once reserved for freelancers and entrepreneurs: the digital nomad existence. Professionals are relocating to coastal towns, mountain villages, and foreign cities, carrying their careers in a laptop bag. Companies that once demanded office presence are now competing for talent by offering location independence as a core benefit.\n\nThe traditional notion of work-life balance is also giving way to a more nuanced concept: work-life integration. Rather than drawing a rigid line between professional and personal hours, many workers now blend the two throughout the day. A parent might step away for school pickup at three o\u2019clock and return to a project after dinner. A morning person might start at six and wrap up by two.\n\nThis integration demands new management skills and a foundation of trust, but the results speak for themselves. Studies consistently show that workers with autonomy over their schedules report higher satisfaction, lower burnout, and stronger loyalty to their employers.',
    trendingWords: [
      {
        word: 'asynchronous communication',
        definition:
          'A form of communication where participants do not need to be present or respond in real time, such as email, recorded video, or shared documents.',
        pronunciation: '/e\u026A\u02C8s\u026A\u014B.kr\u0259.n\u0259s k\u0259\u02CCmju\u02D0.n\u026A\u02C8ke\u026A.\u0283\u0259n/',
        examples: [
          'Asynchronous communication helps global teams avoid the problem of conflicting time zones.',
          'The manager switched to asynchronous communication by replacing daily standups with written check-ins.',
        ],
      },
      {
        word: 'digital nomad',
        definition:
          'A person who works remotely while traveling or living in different locations, relying on technology to perform their job.',
        pronunciation: '/\u02C8d\u026Ad\u0292.\u026A.t\u0259l \u02C8no\u028A.m\u00E6d/',
        examples: [
          'She became a digital nomad after her company adopted a fully remote policy.',
          'Digital nomads often gather in cities with affordable living costs and reliable internet.',
        ],
      },
      {
        word: 'work-life integration',
        definition:
          'An approach that blends professional responsibilities and personal activities throughout the day rather than separating them into distinct blocks.',
        pronunciation: '/w\u025C\u02D0k la\u026Af \u02CC\u026An.t\u026A\u02C8\u0261re\u026A.\u0283\u0259n/',
        examples: [
          'Work-life integration lets her attend midday yoga and finish tasks in the evening.',
          'Critics of work-life integration worry it can lead to always being on the clock.',
        ],
      },
    ],
  },
]

// --- Helpers ---

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function getCategoryColor(category: string): string {
  switch (category) {
    case 'Tech':
      return 'bg-aura-purple/20 text-aura-purple'
    case 'Daily Life':
      return 'bg-aura-gold/20 text-aura-gold'
    case 'Workplace':
      return 'bg-aura-success/20 text-aura-success'
    default:
      return 'bg-aura-surface text-aura-text-dim'
  }
}

function renderHighlightedContent(
  content: string,
  trendingWords: TrendingWord[],
  onWordTap: (word: TrendingWord) => void
): ReactNode {
  const phrases = trendingWords.map((tw) => tw.word)
  if (!phrases.length) return <span>{content}</span>

  // Build a regex to match any trending phrase (case-insensitive)
  const escaped = phrases.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const regex = new RegExp(`(${escaped.join('|')})`, 'gi')
  const segments = content.split(regex)

  return segments.map((segment, i) => {
    const match = trendingWords.find(
      (tw) => tw.word.toLowerCase() === segment.toLowerCase()
    )
    if (match) {
      return (
        <button
          key={i}
          onClick={() => onWordTap(match)}
          className="text-aura-gold font-semibold underline decoration-aura-gold/40 decoration-dotted underline-offset-4 hover:decoration-solid transition-all"
        >
          {segment}
        </button>
      )
    }
    return <span key={i}>{segment}</span>
  })
}

// --- Components ---

function StoryList({
  stories,
  onSelect,
}: {
  stories: Story[]
  onSelect: (story: Story) => void
}) {
  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-aura-text">
          <GradientText variant="aurora">Trending Vocabulary Stories</GradientText>
        </h1>
        <p className="text-sm text-aura-text-dim">
          AI-generated stories that weave in the vocabulary people are using right now.
        </p>
      </div>

      {/* Story cards */}
      <div className="flex flex-col gap-4">
        {stories.map((story) => {
          const wordCount = countWords(story.content)
          return (
            <Card
              key={story.id}
              variant="gradient"
              hoverable
              onClick={() => onSelect(story)}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(story.category)}`}
                    >
                      {story.category}
                    </span>
                    {story.isFresh && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-aura-gold/20 text-aura-gold">
                        ✨ Fresh
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-aura-text-dim">
                    <span>{wordCount} words</span>
                    <span className="w-1 h-1 rounded-full bg-aura-border" />
                    <span className="text-aura-gold">
                      {story.trendingWords.length} trending words
                    </span>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-aura-text">{story.title}</h3>

                <p className="text-sm text-aura-text-dim line-clamp-2 leading-relaxed">
                  {story.content.slice(0, 150)}...
                </p>

                <div className="flex flex-wrap gap-2">
                  {story.trendingWords.map((tw) => (
                    <span
                      key={tw.word}
                      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-aura-gold/10 text-aura-gold border border-aura-gold/20"
                    >
                      {tw.word}
                    </span>
                  ))}
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function StoryView({
  story,
  onBack,
}: {
  story: Story
  onBack: () => void
}) {
  const [selectedWord, setSelectedWord] = useState<TrendingWord | null>(null)
  const { speak, isSpeaking, cancel } = useSpeechSynthesis({ rate: 0.9 })

  const handleListen = useCallback(() => {
    if (isSpeaking) {
      cancel()
    } else {
      speak(story.content)
    }
  }, [isSpeaking, cancel, speak, story.content])

  const handleWordTap = useCallback((word: TrendingWord) => {
    setSelectedWord(word)
  }, [])

  const renderedContent = useMemo(
    () => renderHighlightedContent(story.content, story.trendingWords, handleWordTap),
    [story, handleWordTap]
  )

  return (
    <div className="flex flex-col gap-5 w-full max-w-2xl mx-auto">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-aura-text-dim hover:text-aura-text transition-colors self-start"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
        Back to stories
      </button>

      {/* Header */}
      <div className="flex flex-col gap-2">
        <span
          className={`inline-flex items-center self-start px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(story.category)}`}
        >
          {story.category}
        </span>
        <h1 className="text-2xl font-bold text-aura-text">{story.title}</h1>
        <div className="flex items-center gap-3 text-xs text-aura-text-dim">
          <span>{countWords(story.content)} words</span>
          <span className="w-1 h-1 rounded-full bg-aura-border" />
          <span className="text-aura-gold">
            {story.trendingWords.length} trending words highlighted
          </span>
        </div>
      </div>

      {/* Story content */}
      <Card variant="glass" padding="lg">
        <div className="text-aura-text leading-loose text-base whitespace-pre-line">
          {renderedContent}
        </div>
      </Card>

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={handleListen}
          icon={
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          }
        >
          {isSpeaking ? 'Stop' : 'Listen'}
        </Button>
        <Button variant="gold" className="flex-1">
          Read Aloud
        </Button>
      </div>

      {/* Sources (for fresh content) */}
      {story.sources && story.sources.length > 0 && (
        <Card variant="default" padding="sm">
          <p className="text-xs text-aura-text-dim mb-2 font-medium">Based on these recent sources:</p>
          <ul className="space-y-1">
            {story.sources.map((src, i) => (
              <li key={i} className="text-xs">
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-aura-purple hover:underline line-clamp-1"
                >
                  {i + 1}. {src.title}
                </a>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Word definition modal */}
      <Modal
        isOpen={selectedWord !== null}
        onClose={() => setSelectedWord(null)}
        title={selectedWord?.word}
        size="sm"
      >
        {selectedWord && (
          <div className="flex flex-col gap-4">
            {/* Pronunciation */}
            <p className="text-sm text-aura-text-dim font-mono">
              {selectedWord.pronunciation}
            </p>

            {/* Definition */}
            <div className="flex flex-col gap-1">
              <h4 className="text-xs font-semibold text-aura-text-dim uppercase tracking-wide">
                Definition
              </h4>
              <p className="text-aura-text leading-relaxed text-sm">
                {selectedWord.definition}
              </p>
            </div>

            {/* Example sentences */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-semibold text-aura-text-dim uppercase tracking-wide">
                Examples
              </h4>
              {selectedWord.examples.map((ex, i) => (
                <div
                  key={i}
                  className="flex gap-2 text-sm text-aura-text-dim leading-relaxed"
                >
                  <span className="text-aura-gold shrink-0">{i + 1}.</span>
                  <span>{ex}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

// --- Page ---

export default function Stories() {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)
  const [stories, setStories] = useState<Story[]>(SAMPLE_STORIES)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const profile = useUserStore((s) => s.profile)
  const braveKey = profile ? getEffectiveKey(profile.preferences, 'brave') : ''
  const ai = profile ? getActiveAI(profile.preferences) : null
  const canFetchFresh = braveKey.length > 10 && ai !== null

  const handleGenerateFresh = useCallback(async (category: { label: string; query: string }) => {
    if (!ai) return
    setIsGenerating(true)
    setError(null)
    try {
      const story = await generateStoryFromBrave(
        category.label,
        category.query,
        braveKey,
        (systemPrompt, userMessage) => callAIDirect(systemPrompt, userMessage, ai),
        parseAIJSON
      )

      const newStory: Story = {
        id: `fresh-${Date.now()}`,
        title: story.title,
        category: story.category,
        content: story.content,
        trendingWords: story.trendingWords.map(tw => ({
          word: tw.word,
          definition: tw.definition,
          pronunciation: tw.pronunciation,
          examples: tw.examples,
        })),
        isFresh: true,
        sources: story.sources,
      }

      setStories(prev => [newStory, ...prev])
      setSelectedStory(newStory)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate fresh story')
    } finally {
      setIsGenerating(false)
    }
  }, [ai, braveKey])

  if (selectedStory) {
    return (
      <div className="min-h-screen bg-aura-midnight px-4 py-6">
        <StoryView
          story={selectedStory}
          onBack={() => setSelectedStory(null)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-aura-midnight px-4 py-6">
      <div className="w-full max-w-2xl mx-auto">
        {/* Fresh content section */}
        {canFetchFresh ? (
          <Card variant="aura" padding="md" className="mb-6">
            <div className="flex items-start gap-3 mb-3">
              <span className="text-2xl">📡</span>
              <div className="flex-1">
                <h3 className="font-semibold text-aura-text">Fresh Trending Content</h3>
                <p className="text-xs text-aura-text-dim">Pick a topic — AI fetches today's news and writes a reading passage</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORY_QUERIES.map((cat) => (
                <Button
                  key={cat.label}
                  variant="secondary"
                  size="sm"
                  disabled={isGenerating}
                  onClick={() => handleGenerateFresh(cat)}
                  className="text-xs"
                >
                  {cat.label}
                </Button>
              ))}
            </div>
            {isGenerating && (
              <div className="flex items-center gap-2 mt-3 text-sm text-aura-text-dim">
                <div className="w-4 h-4 border-2 border-aura-purple border-t-transparent rounded-full animate-spin" />
                Fetching fresh content from the web...
              </div>
            )}
            {error && (
              <p className="text-sm text-aura-error mt-3">⚠️ {error}</p>
            )}
          </Card>
        ) : (
          <Card variant="glass" padding="md" className="mb-6">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="text-sm text-aura-text">Want fresh daily content?</p>
                <p className="text-xs text-aura-text-dim mt-1">
                  Add a <strong>Brave Search</strong> API key in Settings (free 2000/month) + an AI key to auto-generate stories from today's trending topics.
                </p>
              </div>
            </div>
          </Card>
        )}

        <StoryList stories={stories} onSelect={setSelectedStory} />
      </div>
    </div>
  )
}
