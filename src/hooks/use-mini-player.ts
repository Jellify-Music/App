import { useCurrentTrack } from '../stores/player/queue'

export default function useIsMiniPlayerActive(): boolean {
	const currentTrack = useCurrentTrack()

	return !!currentTrack
}
