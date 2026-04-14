import { useNavigate } from 'react-router-dom'
import { PRO_CATEGORIES } from '../data/proCategories'
import { ANXIETY_TIER_META, type AnxietyTier } from '../types/professional'
import { useCategoryStore } from '../stores/categoryStore'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { GradientText } from '../components/ui/GradientText'

export default function ProCategories() {
  const navigate = useNavigate()
  const { selectedLevel1, browsingLevel, selectLevel1, goBack } = useCategoryStore()

  const selectedTier = PRO_CATEGORIES.find((c) => c.id === selectedLevel1)
  const tierMeta = selectedLevel1
    ? ANXIETY_TIER_META[selectedLevel1 as AnxietyTier]
    : null

  // Level 1: Anxiety tier cards
  if (browsingLevel === 1 || !selectedTier) {
    return (
      <div className="min-h-screen bg-aura-midnight text-aura-text pb-12">
        <div className="max-w-3xl mx-auto px-4 pt-8 space-y-8">
          <section className="animate-fade-in-up">
            <h1 className="text-2xl font-bold mb-2">
              <GradientText>Scenes</GradientText>
            </h1>
            <p className="text-aura-text-dim">
              Browse practice scenarios organized by how much anxiety they cause.
            </p>
          </section>

          <section className="space-y-4 animate-fade-in-up">
            {PRO_CATEGORIES.map((category) => {
              const meta = ANXIETY_TIER_META[category.id as AnxietyTier]
              if (!meta) return null

              return (
                <Card
                  key={category.id}
                  variant="glass"
                  hoverable
                  padding="lg"
                  className="group"
                  onClick={() => selectLevel1(category.id)}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-aura-purple/20 flex items-center justify-center text-4xl shrink-0">
                      {meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-aura-text group-hover:text-aura-purple transition-colors">
                        {meta.label}
                      </h3>
                      <p className="text-sm text-aura-text-dim mt-0.5">
                        {meta.description}
                      </p>
                      <p className="text-xs text-aura-text-dim/60 mt-1">
                        {category.children?.length ?? 0} scene
                        {(category.children?.length ?? 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="text-aura-text-dim group-hover:text-aura-purple transition-colors text-xl shrink-0">
                      {'\u203A'}
                    </span>
                  </div>
                </Card>
              )
            })}
          </section>
        </div>
      </div>
    )
  }

  // Level 2: Scenes within selected tier
  return (
    <div className="min-h-screen bg-aura-midnight text-aura-text pb-12">
      <div className="max-w-3xl mx-auto px-4 pt-8 space-y-8">
        <section className="animate-fade-in-up">
          <Button variant="ghost" size="sm" onClick={goBack} className="mb-3 -ml-2">
            {'\u2190'} All Tiers
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{tierMeta?.icon}</span>
            <div>
              <h1 className="text-2xl font-bold">
                <GradientText>{tierMeta?.label ?? selectedTier.label}</GradientText>
              </h1>
              <p className="text-sm text-aura-text-dim">
                {tierMeta?.description ?? selectedTier.description}
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3 animate-fade-in-up">
          {selectedTier.children?.map((scene) => (
            <Card
              key={scene.id}
              variant="glass"
              hoverable
              padding="md"
              className="group"
              onClick={() =>
                navigate(
                  `/pro/practice?tier=${selectedLevel1}&scene=${scene.id}`
                )
              }
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-aura-surface-hi flex items-center justify-center text-2xl shrink-0">
                  {scene.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-aura-text group-hover:text-aura-purple transition-colors">
                    {scene.label}
                  </h3>
                  <p className="text-sm text-aura-text-dim mt-0.5">
                    {scene.description}
                  </p>
                </div>
                <span className="text-aura-text-dim group-hover:text-aura-purple transition-colors shrink-0">
                  {'\u203A'}
                </span>
              </div>
            </Card>
          ))}
        </section>
      </div>
    </div>
  )
}
