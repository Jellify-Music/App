import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import ItemRow from '../../Global/components/item-row'
import { FlashList } from '@shopify/flash-list'
import { PlayerParamList } from '../../../screens/Player/types'
import { CommonActions, RouteProp, StackActions, useNavigation } from '@react-navigation/native'
import { RootStackParamList } from '../../../screens/types'
import { getTokenValue } from 'tamagui'
import navigationRef from '../../../../navigation'

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
			contentContainerStyle={{
				marginVertical: getTokenValue('$2'),
			}}
			keyExtractor={({ Id }) => Id!}
			data={route.params.artists}
			renderItem={({ item: artist }) => (
				<ItemRow
					circular
					item={artist}
					onPress={() => {
						rootNavigation.popTo('Tabs')

						navigationRef.dispatch(
							CommonActions.navigate('Artist', {
								artist,
							}),
						)
					}}
				/>
			)}
		/>
	)
}
