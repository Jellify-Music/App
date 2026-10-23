import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '../../screens/types'
import { useNavigation } from '@react-navigation/native'
import { useArtistContext } from '../../providers/Artist'
import { ActivityIndicator } from 'react-native'
import { SizableText, YStack } from 'tamagui'
import ItemRow from '../Global/components/item-row'
import React from 'react'
import { Freeze } from 'react-freeze'
import List from '../Global/helpers/list'

export default function SimilarArtists(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()
	const { artist, similarArtists, fetchingSimilarArtists, fetchingAlbums, albums } =
		useArtistContext()

	return (
		<Freeze freeze={fetchingAlbums && !albums}>
			<YStack flex={1}>
				<SizableText
					margin={'2'}
					size={'6'}
					fontWeight='6'
				>{`Similar to ${artist.Name ?? 'Unknown Artist'}`}</SizableText>

				<List
					data={similarArtists}
					renderItem={({ item: artist }) => (
						<ItemRow
							item={artist}
							onPress={() => {
								navigation.push('Artist', {
									artist,
								})
							}}
						/>
					)}
					ListEmptyComponent={
						fetchingSimilarArtists ? (
							<ActivityIndicator />
						) : (
							<SizableText justify={'center'} textAlign='center'>
								No similar artists
							</SizableText>
						)
					}
				/>
			</YStack>
		</Freeze>
	)
}
