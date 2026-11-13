import { TrackItem } from 'react-native-nitro-player'
import getTrackDto from '../../../utils/mapping/track-extra-payload'

const LyricsQueryKey = (track: TrackItem | null) => [
	'TRACK_LYRICS',
	getTrackDto(track ?? undefined)?.Id,
]

export default LyricsQueryKey
