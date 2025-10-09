"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Brain, ArrowRight, Check } from "lucide-react"
import Link from "next/link"
import { AnimatedGraph } from "@/components/animated-graph"
import { updateProfile } from "@/app/actions/auth"
import { toast } from "sonner"

export default function OnboardingPage() {
  const [interests, setInterests] = useState("")
  const [isComplete, setIsComplete] = useState(false)

  const handleComplete = async () => {
    if (!interests.trim()) {
      toast.error("Por favor ingresa al menos un interés")
      return
    }

    setIsComplete(true)
    
    try {
      const formData = new FormData()
      formData.append('interests', interests)
      formData.append('full_name', '') // Se puede obtener del usuario autenticado
      
      await updateProfile(formData)
      toast.success("Perfil actualizado exitosamente")
      
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 1500)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar perfil")
      setIsComplete(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-xl font-semibold text-foreground">Synapse</span>
            </div>
            <Link href="/">
              <Button variant="ghost" size="sm">
                Exit
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column - Form */}
          <div className="flex flex-col justify-center">
            {/* Progress Indicator */}
            <div className="mb-8 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary">
                <Check className="h-4 w-4" />
              </div>
              <div className="h-0.5 w-12 bg-primary/20" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary">
                <Check className="h-4 w-4" />
              </div>
              <div className="h-0.5 w-12 bg-primary/20" />
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                3
              </div>
            </div>

            <div className="mb-2 text-sm font-medium text-primary">Step 3 of 3</div>
            <h1 className="mb-4 text-4xl font-bold text-foreground">Tell us about your interests</h1>
            <p className="mb-8 text-lg leading-relaxed text-muted-foreground">
              Help us personalize your experience by sharing the topics you're passionate about. We'll use this to
              suggest relevant connections.
            </p>

            {/* Form */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="interests" className="text-base">
                  Your interests and areas of focus
                </Label>
                <Input
                  id="interests"
                  placeholder="e.g., Machine Learning, Product Design, Philosophy..."
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  className="h-12 text-base"
                />
                <p className="text-sm text-muted-foreground">Separate multiple interests with commas</p>
              </div>

              <div className="space-y-3 rounded-lg border border-border bg-card p-4">
                <h3 className="text-sm font-medium text-card-foreground">What happens next?</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                    <span>AI will analyze your interests to suggest relevant content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                    <span>Your knowledge graph will be personalized to your focus areas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                    <span>You'll receive smart recommendations as you add content</span>
                  </li>
                </ul>
              </div>

              <Button
                size="lg"
                className="w-full gap-2"
                onClick={handleComplete}
                disabled={!interests.trim() || isComplete}
              >
                {isComplete ? (
                  <>
                    <Check className="h-5 w-5" />
                    Complete
                  </>
                ) : (
                  <>
                    Complete Setup
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Column - Animated Graph */}
          <div className="flex items-center justify-center">
            <AnimatedGraph />
          </div>
        </div>
      </main>
    </div>
  )
}
