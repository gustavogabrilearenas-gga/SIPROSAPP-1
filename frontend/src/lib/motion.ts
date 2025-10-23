import { AnimatePresence, motion as baseMotion, type ForwardRefComponent } from 'framer-motion'
import type { MouseEventHandler } from 'react'

type MotionWithClassName = {
  [K in keyof typeof baseMotion]: typeof baseMotion[K] extends ForwardRefComponent<infer Element, infer Props>
    ? ForwardRefComponent<Element, Props & { className?: string; onClick?: MouseEventHandler<Element> }>
    : typeof baseMotion[K]
}

export const motion = baseMotion as MotionWithClassName
export { AnimatePresence }
