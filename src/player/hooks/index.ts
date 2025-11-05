import TrackPlayer, { RatingType } from '../../providers/Player/native'
import { CAPABILITIES } from '../constants'

export const useUpdateOptions = async (isFavorite: boolean) => {
	return await TrackPlayer.updateOptions({
		progressUpdateEventInterval: 1,
		capabilities: CAPABILITIES,
		notificationCapabilities: CAPABILITIES,
		ratingType: RatingType.Heart,
		likeOptions: {
			isActive: isFavorite,
			title: 'Favorite',
		},
		dislikeOptions: {
			isActive: !isFavorite,
			title: 'Unfavorite',
		},
	})
}
