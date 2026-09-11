import { SizableText, XStack } from 'tamagui'
import { useAlbumArtists } from '../../../api/queries/artist'
import ItemList from '../../Global/components/Item/item-list'
import { useLibraryArtistsStore } from '../../../stores/library/artist'
import Icon from '../../Global/components/icon'
import { MaterialDesignIconsIconName } from '@react-native-vector-icons/material-design-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { LibraryParamList } from '@/src/screens/Library/types'
import { BaseItemKind, SortOrder } from '@jellyfin/sdk/lib/generated-client'
import { SORTBY_TEXT } from '../../../configs/messaging/sort-by'

export default function ArtistsTab(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<LibraryParamList>>()

	const { isFavorites, setIsFavorites, sortBy, sortOrder, setSortOrder } =
		useLibraryArtistsStore()

	const artistsInfiniteQuery = useAlbumArtists(isFavorites, sortBy, sortOrder)

	const iconName: MaterialDesignIconsIconName = isFavorites ? 'heart' : 'heart-outline'
	const iconLabel = isFavorites ? 'Favorites' : 'All'
	const iconLabelWeight = isFavorites ? '$6' : '$4'

	const sortByLabel = SORTBY_TEXT[sortBy]

	const sortOrderIconName: MaterialDesignIconsIconName =
		sortOrder === SortOrder.Ascending ? 'sort-ascending' : 'sort-descending'
	const sortOrderIconLabel = sortOrder === SortOrder.Ascending ? 'Asc' : 'Desc'

	const onFavoriteIconPress = () => {
		setIsFavorites(isFavorites ? undefined : !isFavorites)
	}

	const onSortByIconPress = () => {
		navigation.navigate('ItemSortBy', { type: BaseItemKind.MusicArtist })
	}

	return (
		<ItemList
			query={artistsInfiniteQuery}
			ListHeaderComponent={
				<XStack margin={'$2'}>
					{/* Favorites Toggle */}
					<XStack
						alignItems='center'
						gap={'$2'}
						margin={'$2'}
						onPress={onFavoriteIconPress}
					>
						<Icon name={iconName} color={'$primary'} />

						<SizableText fontWeight={iconLabelWeight} color={'$primary'}>
							{iconLabel}
						</SizableText>
					</XStack>

					{/* Sort By */}
					<XStack
						alignItems='center'
						gap={'$2'}
						margin={'$2'}
						onPress={onSortByIconPress}
					>
						<Icon name={'sort'} color='$primary' />

						<SizableText fontWeight={'$6'} color={'$primary'}>
							{sortByLabel}
						</SizableText>
					</XStack>

					{/* Sort Order */}
					<XStack alignItems='center' gap={'$2'} margin={'$2'} onPress={() => {}}>
						<Icon name={sortOrderIconName} color='$primary' />

						<SizableText fontWeight={'$6'} color={'$primary'}>
							{sortOrderIconLabel}
						</SizableText>
					</XStack>
				</XStack>
			}
		/>
	)
}
