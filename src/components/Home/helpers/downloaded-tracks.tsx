import React from 'react'
import { View, XStack } from 'tamagui'
import { H4 } from '../../Global/helpers/text'
import { StackParamList } from '../../types'
import { ItemCard } from '../../Global/components/item-card'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import HorizontalCardList from '../../../components/Global/components/horizontal-list'
import Icon from '../../Global/components/icon'
import { useDisplayContext } from '../../../providers/Display/display-provider'
import { useNetworkContext } from '../../../providers/Network'
import { usePlayerContext } from '../../../providers/Player'
import { useQueueContext } from '../../../providers/Player/queue'
import { QueuingType } from '../../../enums/queuing-type'
import { trigger } from 'react-native-haptic-feedback'

export default function DownloadedTracks({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element | null {
	const { downloadedTracks } = useNetworkContext()
	const { horizontalItems } = useDisplayContext()
	const { nowPlaying, useStartPlayback } = usePlayerContext()
	const { useLoadNewQueue } = useQueueContext()

	// Don't show this section if there are no downloaded tracks
	if (!downloadedTracks || downloadedTracks.length === 0) {
		return null
	}

	return (
		<View>
			<XStack
				alignItems='center'
				onPress={() => {
					navigation.navigate('DownloadedTracks')
				}}
			>
				<H4 marginLeft={'$2'}>Downloaded Tracks</H4>
				<Icon name='arrow-right' />
			</XStack>

			<HorizontalCardList
				data={downloadedTracks.slice(0, horizontalItems).map((download) => download.item)}
				renderItem={({ index, item: downloadedTrack }) => (
					<ItemCard
						item={downloadedTrack}
						caption={downloadedTrack.Name}
						subCaption={`${downloadedTrack.Artists?.join(', ')}`}
						squared
						size={'$11'}
						onPress={() => {
							trigger('impactMedium')

							const tracklist = downloadedTracks.map((download) => download.item)

							if (nowPlaying && nowPlaying.item.Id === downloadedTrack.Id) {
								useStartPlayback.mutate()
							} else {
								useLoadNewQueue.mutate(
									{
										track: downloadedTrack,
										index: index,
										tracklist,
										queue: 'Downloaded Tracks',
										queuingType: QueuingType.FromSelection,
									},
									{
										onSuccess: () => useStartPlayback.mutate(),
									},
								)
							}
						}}
					/>
				)}
			/>
		</View>
	)
}
