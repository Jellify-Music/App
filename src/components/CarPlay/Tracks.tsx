import { BaseItemDto, DeviceProfile } from '@jellyfin/sdk/lib/generated-client/models'
import { CarPlay, ListTemplate } from 'react-native-carplay'
import uuid from 'react-native-uuid'
import CarPlayNowPlaying from './NowPlaying'
import { Queue } from '../../player/types/queue-item'
import { QueueMutation } from '../../providers/Player/interfaces'
import { QueuingType } from '../../enums/queuing-type'
import { Api } from '@jellyfin/sdk'
import { JellifyDownload } from '../../types/JellifyDownload'
import { networkStatusTypes } from '../Network/internetConnectionWatcher'
import { DownloadQuality } from '../../providers/Settings'

const TracksTemplate = (
	items: BaseItemDto[],
	loadQueue: (mutation: QueueMutation) => void,
	queuingRef: Queue,
	api: Api | undefined,
	downloadedTracks: JellifyDownload[] | undefined,
	networkStatus: networkStatusTypes | null,
	deviceProfile: DeviceProfile | undefined,
	downloadQuality: DownloadQuality,
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
				downloadQuality,
				downloadedTracks,
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
