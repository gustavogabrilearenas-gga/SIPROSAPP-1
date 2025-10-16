import 'framer-motion'
import type { ReactNode } from 'react'

declare module 'framer-motion' {
  interface MotionProps {
    children?: ReactNode
  }
}
