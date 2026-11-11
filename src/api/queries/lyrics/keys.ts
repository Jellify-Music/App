import { TrackItem } from 'react-native-nitro-player'
import { getTrackItemId } from '../../../utils/mapping/track-extra-payload'

const LyricsQueryKey = (track: TrackItem | null) => [
	'TRACK_LYRICS',
	getTrackItemId(track ?? undefined),
]

export default LyricsQueryKey
