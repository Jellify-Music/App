import { TrackItem } from 'react-native-nitro-player'

const LyricsQueryKey = (track: TrackItem | null) => ['TRACK_LYRICS', track?.id]

export default LyricsQueryKey
