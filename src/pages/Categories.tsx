import { useNavigate } from 'react-router-dom'
import { CATEGORIES } from '../data/categories'
import { useCategoryStore } from '../stores/categoryStore'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { GradientText } from '../components/ui/GradientText'
import { Header } from '../components/layout/Header'

export default function Categories() {
  const navigate = useNavigate()
  const {
    selectedLevel1,
    selectedLevel2,
    browsingLevel,
    selectLevel1,
    selectLevel2,
    selectLevel3,
    goBack,
  } = useCategoryStore()

  const currentL1 = CATEGORIES.find((c) => c.id === selectedLevel1)
  const currentL2 = currentL1?.children?.find((c) => c.id === selectedLevel2)

  const handleL3Select = (id: string) => {
    selectLevel3(id)
    navigate(`/practice?category=${id}`)
  }

  // Build breadcrumb trail
  const breadcrumbs: { label: string; onClick?: () => void }[] = [
    {
      label: 'Categories',
      onClick: browsingLevel > 1 ? () => { useCategoryStore.getState().reset() } : undefined,
    },
  ]
  if (currentL1 && browsingLevel >= 2) {
    breadcrumbs.push({
      label: currentL1.label,
      onClick: browsingLevel > 2 ? goBack : undefined,
    })
  }
  if (currentL2 && browsingLevel >= 3) {
    breadcrumbs.push({ label: currentL2.label })
  }

  return (
    <div className="min-h-screen bg-aura-midnight text-aura-text pb-24">
      <Header showBack title="Categories" />

      <div className="max-w-3xl mx-auto px-4 pt-6 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm animate-fade-in-up">
          {breadcrumbs.map((crumb, idx) => (
            <span key={idx} className="flex items-center gap-1.5">
              {idx > 0 && <span className="text-aura-text-dim/40">/</span>}
              {crumb.onClick ? (
                <button
                  onClick={crumb.onClick}
                  className="text-aura-purple hover:text-aura-purple/80 transition-colors"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-aura-text-dim">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>

        {/* Level 1: Major categories */}
        {browsingLevel === 1 && (
          <div className="space-y-4 animate-fade-in-up">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                <GradientText>Browse Categories</GradientText>
              </h2>
              <p className="text-sm text-aura-text-dim">
                Choose a topic area to explore exercises
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {CATEGORIES.map((category) => (
                <Card
                  key={category.id}
                  variant="gradient"
                  hoverable
                  padding="lg"
                  className="group"
                  onClick={() => selectLevel1(category.id)}
                >
                  <div className="flex flex-col gap-3">
                    <span className="text-3xl">{category.icon}</span>
                    <div>
                      <h3 className="font-semibold text-lg text-aura-text group-hover:text-aura-purple transition-colors">
                        {category.label}
                      </h3>
                      <p className="text-sm text-aura-text-dim mt-1">
                        {category.description}
                      </p>
                    </div>
                    <span className="text-xs text-aura-text-dim/60">
                      {category.children?.length ?? 0} subcategories
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Level 2: Subcategories */}
        {browsingLevel === 2 && currentL1 && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <button
                onClick={goBack}
                className="w-8 h-8 rounded-full flex items-center justify-center text-aura-text-dim hover:text-aura-text hover:bg-aura-surface transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <div>
                <h2 className="text-xl font-bold text-aura-text flex items-center gap-2">
                  <span className="text-2xl">{currentL1.icon}</span>
                  {currentL1.label}
                </h2>
                <p className="text-sm text-aura-text-dim">{currentL1.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentL1.children?.map((sub) => (
                <Card
                  key={sub.id}
                  variant="gradient"
                  hoverable
                  padding="md"
                  className="group"
                  onClick={() => selectLevel2(sub.id)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">{sub.icon}</span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-aura-text group-hover:text-aura-purple transition-colors">
                        {sub.label}
                      </h3>
                      <p className="text-sm text-aura-text-dim mt-0.5">
                        {sub.description}
                      </p>
                      <span className="text-xs text-aura-text-dim/60 mt-1 block">
                        {sub.children?.length ?? 0} topics
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Level 3: Sub-subcategories */}
        {browsingLevel === 3 && currentL2 && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <button
                onClick={goBack}
                className="w-8 h-8 rounded-full flex items-center justify-center text-aura-text-dim hover:text-aura-text hover:bg-aura-surface transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <div>
                <h2 className="text-xl font-bold text-aura-text flex items-center gap-2">
                  <span className="text-2xl">{currentL2.icon}</span>
                  {currentL2.label}
                </h2>
                <p className="text-sm text-aura-text-dim">{currentL2.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {currentL2.children?.map((topic) => (
                <Card
                  key={topic.id}
                  variant="gradient"
                  hoverable
                  padding="md"
                  className="group"
                  onClick={() => handleL3Select(topic.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{topic.icon}</span>
                      <div>
                        <h3 className="font-semibold text-aura-text group-hover:text-aura-purple transition-colors">
                          {topic.label}
                        </h3>
                        <p className="text-sm text-aura-text-dim mt-0.5">
                          {topic.description}
                        </p>
                      </div>
                    </div>
                    <span className="text-aura-text-dim group-hover:text-aura-purple transition-colors shrink-0 ml-3">
                      {'\u203A'}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
