import useAppActive from './use-app-active'
import { useCurrentTrack } from '../stores/player/queue'

export default function useIsMiniPlayerActive(): boolean {
	const isAppActive = useAppActive()

	const currentTrack = useCurrentTrack()

	return !!currentTrack && isAppActive
}
