import JellifyTrack from '@/src/types/JellifyTrack'

const LyricsQueryKey = (track: JellifyTrack | undefined) => ['TRACK_LYRICS', track?.item.Id]

export default LyricsQueryKey
