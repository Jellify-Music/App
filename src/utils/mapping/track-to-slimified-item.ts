import { BaseItemDtoSlimified, getTrackExtraPayload } from '../../types/JellifyTrack'
import { TrackItem } from 'react-native-nitro-player'

export default function mapTrackToSlimifiedItem(track: TrackItem): BaseItemDtoSlimified {
	return {
		Id: track.id,
		Name: track.title,
		ArtistItems: getTrackExtraPayload(track)?.ArtistItems,
		AlbumId: getTrackExtraPayload(track)?.AlbumId,
		ImageBlurHashes: {
			Primary: {
				0: getTrackExtraPayload(track)!.ImageBlurHash!,
			},
		},
	}
}
