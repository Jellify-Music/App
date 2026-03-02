import useAppActive from './use-app-active'
import { useIsPlayerFocused } from '../stores/player/display'
import { useCurrentTrack } from '../stores/player/queue'

export default function useIsMiniPlayerActive(): boolean {
	const isAppActive = useAppActive()

	const currentTrack = useCurrentTrack()

	const isPlayerFocused = useIsPlayerFocused()

	return !!currentTrack && isAppActive && !isPlayerFocused
}
