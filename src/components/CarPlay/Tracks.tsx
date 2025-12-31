import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { CarPlay, ListTemplate } from 'react-native-carplay'
import uuid from 'react-native-uuid'
import CarPlayNowPlaying from './NowPlaying'
import { Queue } from '../../player/types/queue-item'
import { QueueMutation } from '../../providers/Player/interfaces'
import { QueuingType } from '../../enums/queuing-type'
import { queryClient } from '../../constants/query-client'
import { AlbumDiscsQuery } from '../../api/queries/album'
import { getApi } from '../../stores'
import AlbumTemplate from './Album'
import { AlbumDiscsQueryKey } from '../../api/queries/album/keys'

const TracksTemplate = (
	items: BaseItemDto[],
	loadQueue: (mutation: QueueMutation) => void,
	queuingRef: Queue,
) =>
	new ListTemplate({
		id: uuid.v4(),
		sections: [
			{
				items: items.map(({ Id, Name, Type }) => {
					const isAlbum = Type === BaseItemKind.MusicAlbum

					return {
						id: Id!,
						text: Name ?? `Untitled ${isAlbum ? 'Album' : 'Track'}`,
						browsable: isAlbum,
					}
				}),
			},
		],
		onItemSelect: async ({ index }) => {
			const item = items[index]

			const tracks = items.filter(({ Type }) => Type === BaseItemKind.Audio)

			const startIndex = tracks.indexOf(item)

			if (startIndex === -1) {
				queryClient.ensureQueryData(AlbumDiscsQuery(getApi(), item))

				CarPlay.pushTemplate(
					AlbumTemplate(
						item,
						loadQueue,
						queryClient.getQueryData(AlbumDiscsQueryKey(item))!,
					),
				)
			} else {
				loadQueue({
					queuingType: QueuingType.FromSelection,
					index,
					tracklist: items,
					queue: queuingRef,
					shuffled: false,
					track: items[index],
					startPlayback: true,
				})

				CarPlay.pushTemplate(CarPlayNowPlaying)
			}
		},
	})

export default TracksTemplate
