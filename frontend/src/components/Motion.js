import { motion } from 'framer-motion'

export const MotionDiv = motion.div
export const MotionButton = motion.button

export const pageVariants = {
  initial: { opacity: 0, y: 10, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -10, filter: 'blur(6px)' },
}

export const pageTransition = { duration: 0.35, ease: [0.22, 1, 0.36, 1] }

