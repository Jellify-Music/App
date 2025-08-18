import { InstantMixProps } from '../../screens/types'
import { FlatList } from 'react-native'
import Track from '../Global/components/track'
import { Separator } from 'tamagui'

export default function InstantMix({ route, navigation }: InstantMixProps): React.JSX.Element {
	const { mix } = route.params

	return (
		<FlatList
			contentInsetAdjustmentBehavior='automatic'
			data={mix}
			ItemSeparatorComponent={() => <Separator />}
			renderItem={({ item, index }) => (
				<Track
					navigation={navigation}
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
