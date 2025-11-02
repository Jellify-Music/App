import { useCallback } from 'react'
import { InstantMixProps } from '../../screens/types'
import Track from '../Global/components/track'
import { Separator } from 'tamagui'
import { FlashList } from '@shopify/flash-list'
import { closeAllSwipeableRows } from '../Global/components/swipeable-row-registry'

export default function InstantMix({ route, navigation }: InstantMixProps): React.JSX.Element {
	const { mix } = route.params
	const handleScrollBeginDrag = useCallback(() => {
		closeAllSwipeableRows()
	}, [])

	return (
		<FlashList
			contentInsetAdjustmentBehavior='automatic'
			data={mix}
			ItemSeparatorComponent={() => <Separator />}
			onScrollBeginDrag={handleScrollBeginDrag}
			renderItem={({ item, index }) => (
				<Track
					showArtwork
					track={item}
					index={index}
					queue={'Instant Mix'}
					tracklist={mix}
				/>
			)}
		/>
	)
}
