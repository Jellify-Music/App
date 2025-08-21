import { InstantMixProps } from '../../screens/types'
import Track from '../Global/components/track'
import { Separator } from 'tamagui'
import { FlashList } from '@shopify/flash-list'

export default function InstantMix({ route, navigation }: InstantMixProps): React.JSX.Element {
	const { mix } = route.params

	return (
		<FlashList
			contentInsetAdjustmentBehavior='automatic'
			data={mix}
			ItemSeparatorComponent={() => <Separator />}
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
