import { useToastStore } from '@/store/useToastStore'

export function useToast() {
  const { success, error, warning, info, show } = useToastStore()
  return { success, error, warning, info, show }
}
