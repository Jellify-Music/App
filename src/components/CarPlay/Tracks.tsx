import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { CarPlay, ListTemplate } from 'react-native-carplay'
import TrackPlayer from 'react-native-track-player'
import uuid from 'react-native-uuid'
import CarPlayNowPlaying from './NowPlaying'
import { queryClient } from '../../constants/query-client'
import { QueryKeys } from '../../enums/query-keys'
import { Api } from '@jellyfin/sdk'
import React from 'react'
import { QueueContext } from '../../providers/Player/queue'
import { Queue } from '../../player/types/queue-item'

const TracksTemplate = (api: Api, sessionId: string, items: BaseItemDto[], queuingRef: Queue) =>
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
		onItemSelect: async (item) => {
			const { loadQueue } = React.useContext(QueueContext)

			console.debug(`loadQueue ${loadQueue}`)

			await loadQueue(items, queuingRef, 0)

			CarPlay.pushTemplate(CarPlayNowPlaying)
		},
	})

export default TracksTemplate
