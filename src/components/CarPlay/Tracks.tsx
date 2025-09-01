import { BaseItemDto, DeviceProfile } from '@jellyfin/sdk/lib/generated-client/models'
import { CarPlay, ListTemplate } from 'react-native-carplay'
import uuid from 'react-native-uuid'
import CarPlayNowPlaying from './NowPlaying'
import { Queue } from '../../player/types/queue-item'
import { QueueMutation } from '../../providers/Player/interfaces'
import { QueuingType } from '../../enums/queuing-type'
import { Api } from '@jellyfin/sdk'
import { networkStatusTypes } from '../Network/internetConnectionWatcher'

const TracksTemplate = (
	items: BaseItemDto[],
	loadQueue: (mutation: QueueMutation) => void,
	queuingRef: Queue,
	api: Api | undefined,
	networkStatus: networkStatusTypes | null,
	deviceProfile: DeviceProfile | undefined,
) =>
	new ListTemplate({
		id: uuid.v4(),
		sections: [
			{
				items:
					items?.map((item) => {
						return {
							id: item.Id!,
							text: item.Name ?? 'Untitled',
						}
					}) ?? [],
			},
		],
		onItemSelect: async ({ index }) => {
			loadQueue({
				api,
				networkStatus,
				deviceProfile,
				queuingType: QueuingType.FromSelection,
				index,
				tracklist: items,
				queue: queuingRef,
				shuffled: false,
				track: items[index],
				startPlayback: true,
			})

			CarPlay.pushTemplate(CarPlayNowPlaying)
		},
	})

export default TracksTemplate
