import { toast } from '@/hooks/use-toast'

export function showSuccess(message: string, description?: string) {
  if (description) {
    toast.success(message, { description })
    return
  }

  toast.success(message)
}

export function showError(message: string, description?: string) {
  if (description) {
    toast.error(message, { description })
    return
  }

  toast.error(message)
}
