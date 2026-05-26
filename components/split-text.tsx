'use client'

import { motion, Easing } from 'framer-motion'

interface SplitTextProps {
  text: string
  className?: string
  delay?: number
  stagger?: number
  ease?: Easing
}

export function SplitText({
  text,
  className,
  delay = 0,
  stagger = 0.06,
  ease = [0.22, 1, 0.36, 1] as Easing,
}: SplitTextProps) {
  const words = text.split(' ')

  return (
    <span className={className} aria-label={text} role="text">
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden pb-1 leading-[1.1]">
          <motion.span
            initial={{ y: '105%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: delay + i * stagger,
              duration: 0.65,
              ease,
            }}
            className="inline-block"
          >
            {word}
          </motion.span>
          {i < words.length - 1 && ' '}
        </span>
      ))}
    </span>
  )
}
