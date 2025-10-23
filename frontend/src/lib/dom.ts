import type { MouseEventHandler } from 'react'

export const stopClickPropagation: MouseEventHandler<HTMLElement> = (event) => {
  event.stopPropagation()
}
