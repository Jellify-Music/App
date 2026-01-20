import useAppActive from './use-app-active'
import { useCurrentTrack } from '../stores/player/queue'
import { useIsPlayerFocused } from '../stores/player/display'

export default function useIsMiniPlayerActive(): boolean {
	const isAppActive = useAppActive()

	const nowPlaying = useCurrentTrack()

	const isPlayerFocused = useIsPlayerFocused()

	return !!nowPlaying && isAppActive && !isPlayerFocused
}
