import useAppActive from './use-app-active'
import { useIsPlayerFocused } from '../stores/player/display'
import { useNowPlaying } from 'react-native-nitro-player'

export default function useIsMiniPlayerActive(): boolean {
	const isAppActive = useAppActive()

	const playerState = useNowPlaying()
	const nowPlaying = playerState.currentTrack

	const isPlayerFocused = useIsPlayerFocused()

	return !!nowPlaying && isAppActive && !isPlayerFocused
}
