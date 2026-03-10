import { Outlet } from 'react-router-dom'
import GradientBackground from '../components/GradientBackground'
import { MotionDiv, pageTransition, pageVariants } from '../components/Motion'
import { motion } from 'framer-motion'

function Hero3D() {
  return (
    <div className="relative">
      <MotionDiv
        className="glass rounded-3xl p-10 overflow-hidden"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.08 }}
      >
        <div className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-zinc-300">College</div>
        <div className="mt-3 text-5xl font-semibold leading-[1.05]">
          GATE PASS<span className="text-brand-600 dark:text-brand-300"> SYSTEM</span>
        </div>
        <div className="mt-4 text-zinc-600 dark:text-zinc-300 max-w-md">
          Request → Approve → Verify. Fast, secure, and beautifully animated for students, admins, and security.
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { k: 'JWT', v: 'Secure roles' },
            { k: 'QR', v: 'Instant verify' },
            { k: 'Live', v: 'Realtime updates' },
          ].map((x) => (
            <motion.div
              key={x.k}
              className="neo rounded-2xl p-4"
              whileHover={{ y: -4, rotateX: 4, rotateY: -4 }}
              transition={{ type: 'spring', stiffness: 240, damping: 16 }}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{x.k}</div>
              <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{x.v}</div>
            </motion.div>
          ))}
        </div>

        {/* 3D floating scene */}
        <div className="pointer-events-none relative mt-10 h-[230px]">
          <motion.div
            className="absolute left-0 top-6 h-40 w-64 rounded-3xl bg-gradient-to-br from-brand-500/25 to-fuchsia-500/10 dark:from-brand-500/20 dark:to-fuchsia-500/10 border border-black/10 dark:border-white/10 backdrop-blur-xl"
            animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            style={{ boxShadow: '0 30px 80px rgba(0,0,0,.18)', transformStyle: 'preserve-3d' }}
          >
            <div className="p-5">
              <div className="text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-300">Gatepass</div>
              <div className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Approved</div>
              <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Out: 10:30 • In: 17:30</div>
              <div className="mt-6 h-10 w-28 rounded-xl bg-black/10 dark:bg-white/10" />
            </div>
          </motion.div>

          <motion.div
            className="absolute right-2 top-2 h-44 w-60 rounded-3xl bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-xl"
            animate={{ y: [0, 12, 0], rotate: [2, -2, 2] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            style={{ boxShadow: '0 36px 90px rgba(0,0,0,.16)', transformStyle: 'preserve-3d' }}
          >
            <div className="p-5">
              <div className="text-xs uppercase tracking-wider text-zinc-600 dark:text-zinc-300">Scan</div>
              <div className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">QR Verify</div>
              <div className="mt-4 grid grid-cols-6 gap-1">
                {Array.from({ length: 36 }).map((_, i) => (
                  <motion.div
                    // eslint-disable-next-line react/no-array-index-key
                    key={i}
                    className="aspect-square rounded-[4px] bg-black/20 dark:bg-white/20"
                    animate={{ opacity: [0.45, 0.9, 0.45] }}
                    transition={{ duration: 1.8, repeat: Infinity, delay: (i % 12) * 0.05 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            className="absolute left-1/2 bottom-0 h-20 w-[420px] -translate-x-1/2 rounded-full bg-black/10 dark:bg-black/40 blur-2xl"
            animate={{ scale: [1, 1.06, 1], opacity: [0.55, 0.7, 0.55] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </MotionDiv>
    </div>
  )
}

export default function AuthLayout() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <GradientBackground />
      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center px-6 py-10 lg:grid-cols-2 lg:gap-10">
        <MotionDiv
          className="glass rounded-3xl p-7 md:p-10"
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={pageTransition}
        >
          <Outlet />
        </MotionDiv>

        <div className="hidden lg:block">
          <Hero3D />
        </div>
      </div>
    </div>
  )
}

