import { BaseStackNavigator } from '../../screens/base-types'
import { useNavigation } from '@react-navigation/native'
import { useArtistContext } from '../../providers/Artist'
import { ActivityIndicator } from 'react-native'
import { SizableText, YStack } from 'tamagui'
import ItemRow from '../Global/components/item-row'
import React from 'react'
import { Freeze } from 'react-freeze'
import List from '../Global/components/Lists/utils'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { LegendListRenderItemProps } from '@legendapp/list/react-native'
import { useTranslation } from 'react-i18next'

export default function SimilarArtists(): React.JSX.Element {
	const { t } = useTranslation()

	const navigation = useNavigation<BaseStackNavigator>()
	const { artist, similarArtists, fetchingSimilarArtists, fetchingAlbums, albums } =
		useArtistContext()

	const renderItem = ({ item: artist }: LegendListRenderItemProps<BaseItemDto>) => (
		<ItemRow
			item={artist}
			onPress={() => {
				navigation.push('Artist', {
					artist,
				})
			}}
		/>
	)

	return (
		<Freeze freeze={fetchingAlbums && !albums}>
			<YStack flex={1}>
				<SizableText margin={'2'} size={'3'} fontWeight='6'>
					{t('artist.similarTo', {
						name: artist.Name ?? t('placeholders.unknownArtist'),
					})}
				</SizableText>

				<List
					data={similarArtists?.slice(0, 5)}
					renderItem={renderItem}
					ListEmptyComponent={
						<ListEmptyComponent fetchingSimilarArtists={fetchingSimilarArtists} />
					}
				/>
			</YStack>
		</Freeze>
	)
}

interface ListEmptyComponentProps {
	fetchingSimilarArtists: boolean
}

function ListEmptyComponent({ fetchingSimilarArtists }: ListEmptyComponentProps) {
	const { t } = useTranslation()

	return fetchingSimilarArtists ? (
		<ActivityIndicator />
	) : (
		<SizableText fontSize='3' color={'neutral'} justify={'center'} textAlign='center'>
			{t('artist.noSimilarArtists')}
		</SizableText>
	)
}
