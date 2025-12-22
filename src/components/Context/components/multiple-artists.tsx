import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import ItemRow from '../../Global/components/item-row'
import { FlashList } from '@shopify/flash-list'
import { PlayerParamList } from '../../../screens/Player/types'
import { RootNavigator, RouteProp, useNavigation } from '@react-navigation/native'
import { getTokenValue } from 'tamagui'

interface MultipleArtistsProps {
	navigation: NativeStackNavigationProp<PlayerParamList, 'MultipleArtistsSheet'>
	route: RouteProp<PlayerParamList, 'MultipleArtistsSheet'>
}
export default function MultipleArtists({
	navigation,
	route,
}: MultipleArtistsProps): React.JSX.Element {
	const rootNavigation = useNavigation<RootNavigator>()
	return (
		<FlashList
			contentContainerStyle={{
				marginVertical: getTokenValue('$2'),
			}}
			data={route.params.artists}
			renderItem={({ item: artist }) => (
				<ItemRow
					circular
					item={artist}
					key={artist.Id}
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
