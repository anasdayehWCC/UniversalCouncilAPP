'use client'

import { Button } from '@careminutes/ui'
import { ChevronLeft, Mic, MonitorPlay, Upload, type LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const CardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      delay: i * 0.1, // Stagger by 100ms
      ease: 'easeOut'
    }
  })
}

const OptionCard = ({
  href,
  icon: Icon,
  title,
  description,
  color = 'primary',
  index,
  helper
}: {
  href: string
  icon: LucideIcon
  title: string
  description: string
  color?: 'primary' | 'secondary' | 'accent' | 'accent-alt'
  index: number
  helper?: string
}) => {
  const colorClasses = {
    primary: 'bg-primary/10 text-primary group-hover:bg-primary/20',
    secondary: 'bg-secondary/10 text-secondary group-hover:bg-secondary/20',
    accent: 'bg-accent/10 text-accent group-hover:bg-accent/20',
    'accent-alt': 'bg-accent-alt/10 text-accent-alt group-hover:bg-accent-alt/20'
  }

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={CardVariants}
    >
      <Link
        href={href}
        aria-label={`${title} — ${description}`}
        className="group flex items-center gap-4 rounded-2xl p-6 glass-panel-premium hover:scale-[1.02] hover:border-accent/50 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <div className={`rounded-xl p-3 transition-colors ${colorClasses[color]}`}>
          <Icon size={28} className="shrink-0" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-1 text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          {helper && (
            <p className="mt-1 text-xs text-muted-foreground/80 sm:hidden">{helper}</p>
          )}
        </div>
        <ChevronLeft className="h-5 w-5 rotate-180 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </Link>
    </motion.div>
  )
}

export default function NewTranscriptPage() {
  return (
    <div className="container mx-auto max-w-4xl px-8 py-12">
      <Button
        asChild
        variant="link"
        className="mb-8 self-start px-0 underline hover:decoration-2 text-muted-foreground hover:text-foreground"
      >
        <Link href="/">
          <span className="flex items-center">
            <ChevronLeft />
            Back to Dashboard
          </span>
        </Link>
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-10"
      >
        <h1 className="text-4xl font-bold mb-3 text-foreground">Start New Recording</h1>
        <p className="text-lg text-muted-foreground">
          Choose how you&apos;d like to capture your meeting or session
        </p>
      </motion.div>

      <div className="@container">
        <div className="grid grid-cols-1 @md:grid-cols-2 @lg:grid-cols-4 gap-4">
          <OptionCard
            href="/new/upload"
            icon={Upload}
            title="Upload File"
            description="Upload a recording from your computer"
            color="primary"
            helper="Best when you already have local audio"
            index={0}
          />

          <OptionCard
            href="/new/record-virtual"
            icon={MonitorPlay}
            title="Record Virtual Meeting"
            description="Record a virtual meeting in another tab"
            color="accent"
            helper="Capture tabs/meetings running now"
            index={1}
          />

          <OptionCard
            href="/new/record-audio"
            icon={Mic}
            title="Record Audio"
            description="Record audio using your microphone"
            color="secondary"
            helper="For in-person quick notes"
            index={2}
          />

          <OptionCard
            href="/capture"
            icon={Mic}
            title="Offline Capture (Mobile)"
            description="Use in low-signal areas and auto-sync later"
            color="accent-alt"
            helper="Queues safely; syncs when online"
            index={3}
          />
        </div>
      </div>
    </div>
  )
}
