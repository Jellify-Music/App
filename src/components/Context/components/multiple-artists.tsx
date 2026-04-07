import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import ItemRow from '../../Global/components/item-row'
import { PlayerParamList } from '../../../screens/Player/types'
import { RouteProp, StackActions, useNavigation } from '@react-navigation/native'
import { RootStackParamList } from '../../../screens/types'
import { YGroup } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import navigationRef from '../../../screens/navigation'

interface MultipleArtistsProps {
	navigation: NativeStackNavigationProp<PlayerParamList, 'MultipleArtistsSheet'>
	route: RouteProp<PlayerParamList, 'MultipleArtistsSheet'>
}
export default function MultipleArtists({
	navigation,
	route,
}: MultipleArtistsProps): React.JSX.Element {
	const rootNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

	const { bottom } = useSafeAreaInsets()

	const artistItemRows = route.params.artists.map((artist) => (
		<ItemRow
			key={`${artist.Id}-${artist.Name}`}
			circular
			item={artist}
			onPress={() => {
				rootNavigation.popTo('Tabs')

				navigationRef.dispatch(
					StackActions.push('Artist', {
						artist,
					}),
				)
			}}
		/>
	))

	return (
		<YGroup marginBottom={bottom} marginTop={'$4'}>
			{artistItemRows}
		</YGroup>
	)
}
