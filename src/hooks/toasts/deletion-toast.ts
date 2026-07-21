import { formatBytes } from '../../utils/formatting/bytes'
import { useSuccessToast } from '.'

export const useDeletionToast = () => (message: string, freedBytes: number) => {
	const toast = useSuccessToast()

	return toast({
		title: message,
		message: `Freed ${formatBytes(freedBytes)}`,
	})
}
