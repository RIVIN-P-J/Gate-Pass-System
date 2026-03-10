import { MotionDiv } from './Motion'
import { cn } from '../lib/cn'

export default function GradientBackground({ className }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      <MotionDiv
        className="absolute -top-52 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-brand-500/30 dark:bg-brand-600/35 blur-3xl"
        animate={{ y: [0, 24, 0], scale: [1, 1.06, 1], rotate: [0, 6, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <MotionDiv
        className="absolute -bottom-52 -left-40 h-[620px] w-[620px] rounded-full bg-fuchsia-500/20 dark:bg-fuchsia-500/25 blur-3xl"
        animate={{ y: [0, -22, 0], x: [0, 22, 0], rotate: [0, -8, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
      <MotionDiv
        className="absolute top-1/3 -right-40 h-[520px] w-[520px] rounded-full bg-emerald-400/14 dark:bg-emerald-400/16 blur-3xl"
        animate={{ y: [0, 16, 0], x: [0, -16, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 bg-grid opacity-70 dark:opacity-55" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/5 to-black/10 dark:via-black/20 dark:to-black/60" />
      <div className="absolute inset-0 opacity-[0.06] mix-blend-overlay [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,.5)_1px,transparent_0)] [background-size:12px_12px]" />
    </div>
  )
}

