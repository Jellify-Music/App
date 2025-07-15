import { ScrollView, View } from 'tamagui'
import { MultipleArtistsProps } from '../../types'
import ItemRow from '../../Global/components/item-row'
import { useEffect } from 'react'

export default function MultipleArtists({
	navigation,
	route,
}: MultipleArtistsProps): React.JSX.Element {
	return (
		<ScrollView>
			{route.params.artists.map((artist) => {
				return (
					<ItemRow
						circular
						key={artist.Id}
						item={artist}
						queueName={''}
						navigation={navigation}
						onPress={() => {
							navigation.goBack()
							navigation.goBack()
							navigation.navigate('Tabs', {
								screen: 'Library',
								params: {
									screen: 'Artist',
									params: {
										artist: artist,
									},
								},
							})
						}}
					/>
				)
			})}
		</ScrollView>
	)
}
