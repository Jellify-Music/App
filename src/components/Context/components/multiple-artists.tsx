import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import ItemRow from '../../Global/components/item-row'
import { FlashList } from '@shopify/flash-list'
import { PlayerParamList } from '../../../screens/Player/types'
import { RouteProp, useNavigation } from '@react-navigation/native'
import { RootStackParamList } from '../../../screens/types'

interface MultipleArtistsProps {
	navigation: NativeStackNavigationProp<PlayerParamList, 'MultipleArtistsSheet'>
	route: RouteProp<PlayerParamList, 'MultipleArtistsSheet'>
}
export default function MultipleArtists({
	navigation,
	route,
}: MultipleArtistsProps): React.JSX.Element {
	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
	return (
		<FlashList
			data={route.params.artists}
			renderItem={({ item: artist }) => (
				<ItemRow
					circular
					key={artist.Id}
					item={artist}
					queueName={''}
					onPress={() => {
						navigation.popToTop()

						rootNavigation.popTo('Tabs', {
							screen: 'LibraryTab',
							params: {
								screen: 'Artist',
								params: {
									artist,
								},
							},
						})
					}}
				/>
			)}
		/>
	)
}
