import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '../../screens/types'
import { useNavigation } from '@react-navigation/native'
import { Text } from '../Global/helpers/text'
import { useArtistContext } from '../../providers/Artist'
import { ActivityIndicator } from 'react-native'
import { YStack } from 'tamagui'
import { FlashList } from '@shopify/flash-list'
import ItemRow from '../Global/components/item-row'
import React from 'react'
import { Freeze } from 'react-freeze'

export default function SimilarArtists(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<BaseStackParamList>>()
	const { artist, similarArtists, fetchingSimilarArtists, fetchingAlbums, albums } =
		useArtistContext()

	return (
		<Freeze freeze={fetchingAlbums && !albums}>
			<YStack flex={1}>
				<Text
					margin={'$2'}
					fontSize={'$6'}
					bold
				>{`Similar to ${artist.Name ?? 'Unknown Artist'}`}</Text>

				<FlashList
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
							<Text justify={'center'} textAlign='center'>
								No similar artists
							</Text>
						)
					}
				/>
			</YStack>
		</Freeze>
	)
}
