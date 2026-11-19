import ItemRow from '../Global/components/item-row'
import { MultipleArtistsProps } from '../../screens/Player/types'
import { RootNavigator, StackActions, useNavigation } from '@react-navigation/native'
import { YGroup } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import navigationRef from '../../screens/navigation'

export default function MultipleArtists({ route }: MultipleArtistsProps): React.JSX.Element {
	const rootNavigation = useNavigation<RootNavigator>()

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
		<YGroup gap='2' marginBottom={bottom} marginVertical='4' marginHorizontal='2' width='100%'>
			{artistItemRows}
		</YGroup>
	)
}
