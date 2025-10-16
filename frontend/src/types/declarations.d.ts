declare module 'framer-motion' {
  export interface AnimatePresenceProps {
    children: React.ReactNode
  }
  export interface MotionProps {
    initial?: any
    animate?: any
    transition?: any
    className?: string
    onClick?: (e: React.MouseEvent) => void
  }
  export const motion: {
    [key: string]: React.ComponentType<MotionProps>
  }
  export const AnimatePresence: React.ComponentType<AnimatePresenceProps>
}

declare module 'lucide-react' {
  export const Activity: React.ComponentType<{ className?: string }>
  export const Users: React.ComponentType<{ className?: string }>
  export const Plus: React.ComponentType<{ className?: string }>
  export const RefreshCw: React.ComponentType<{ className?: string }>
  export const Search: React.ComponentType<{ className?: string }>
  export const Edit: React.ComponentType<{ className?: string }>
  export const Ban: React.ComponentType<{ className?: string }>
  export const CheckCircle: React.ComponentType<{ className?: string }>
  export const Key: React.ComponentType<{ className?: string }>
  export const ArrowLeft: React.ComponentType<{ className?: string }>
  export const Settings: React.ComponentType<{ className?: string }>
  export const Shield: React.ComponentType<{ className?: string }>
  export const Mail: React.ComponentType<{ className?: string }>
  export const Phone: React.ComponentType<{ className?: string }>
  export const Briefcase: React.ComponentType<{ className?: string }>
  export const Clock: React.ComponentType<{ className?: string }>
}
