import { toast } from '@/hooks/use-toast'

export function showSuccess(message: string) {
  toast.success(message)
}

export function showError(message: string) {
  toast.error(message)
}
