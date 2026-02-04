import React, { useCallback, useMemo, useState, useRef } from 'react'
import { YStack, XStack, Button, Spinner } from 'tamagui'
import { FlashList, ListRenderItem } from '@shopify/flash-list'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { useGenres } from '../../api/queries/genre'
import { Text } from '../../components/Global/helpers/text'
import ItemImage from '../../components/Global/components/image'
import Icon from '../../components/Global/components/icon'
import { triggerHaptic } from '../../hooks/use-haptic-feedback'
import { GenreSelectionProps } from '../types'
import useLibraryStore from '../../stores/library'
import { getItemName } from '../../utils/formatting/item-names'

export default function GenreSelectionScreen({
	navigation,
}: GenreSelectionProps): React.JSX.Element {
	const genresInfiniteQuery = useGenres()
	const {
		data: genres,
		hasNextPage,
		fetchNextPage,
		isPending,
		isFetchingNextPage,
	} = genresInfiniteQuery
	const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>(
		useLibraryStore.getState().filters.tracks.genreIds ?? [],
	)
	// Group genres by first letter for A-Z navigation
	const genresByLetter = useMemo(() => {
		if (!genres) return new Map<string, BaseItemDto[]>()
		const grouped = new Map<string, BaseItemDto[]>()
		genres.forEach((genre) => {
			const name = genre.Name ?? genre.SortName ?? ''
			const firstLetter = name.charAt(0).toUpperCase()
			const letter = /[A-Z]/.test(firstLetter) ? firstLetter : '#'
			if (!grouped.has(letter)) {
				grouped.set(letter, [])
			}
			grouped.get(letter)!.push(genre)
		})
		return grouped
	}, [genres])

	// Flatten grouped genres for display, maintaining letter sections
	const flattenedGenres = useMemo(() => {
		const result: (BaseItemDto | string)[] = []
		const sortedLetters = Array.from(genresByLetter.keys()).sort((a, b) => {
			if (a === '#') return -1 // "#" goes to the top
			if (b === '#') return 1
			return a.localeCompare(b)
		})
		sortedLetters.forEach((letter) => {
			result.push(letter) // Section header
			const letterGenres = genresByLetter.get(letter)!
			letterGenres.sort((a, b) => {
				const aName = a.Name ?? a.SortName ?? ''
				const bName = b.Name ?? b.SortName ?? ''
				return aName.localeCompare(bName)
			})
			result.push(...letterGenres)
		})
		return result
	}, [genresByLetter])

	const toggleGenre = useCallback(
		(genreId: string) => {
			triggerHaptic('impactLight')
			setSelectedGenreIds((prev) => {
				if (prev.includes(genreId)) {
					return prev.filter((id) => id !== genreId)
				} else {
					return [...prev, genreId]
				}
			})
		},
		[triggerHaptic],
	)

	const handleSave = useCallback(() => {
		triggerHaptic('impactLight')
		useLibraryStore.getState().setTracksFilters({
			genreIds: selectedGenreIds.length > 0 ? selectedGenreIds : undefined,
			// Clear downloaded filter when genres are selected
			isDownloaded: selectedGenreIds.length > 0 ? false : undefined,
		})
		navigation.goBack()
	}, [selectedGenreIds, navigation, triggerHaptic])

	const handleClear = useCallback(() => {
		triggerHaptic('impactLight')
		setSelectedGenreIds([])
		useLibraryStore.getState().setTracksFilters({
			genreIds: undefined,
		})
	}, [triggerHaptic])

	const renderItem: ListRenderItem<BaseItemDto | string> = ({ item }) => {
		if (typeof item === 'string') {
			// Section header
			return (
				<YStack
					paddingVertical='$2'
					paddingHorizontal='$4'
					backgroundColor='$backgroundHover'
				>
					<Text bold fontSize='$5'>
						{item}
					</Text>
				</YStack>
			)
		}

		const isSelected = selectedGenreIds.includes(item.Id!)
		const genreName = getItemName(item)

		return (
			<XStack
				alignItems='center'
				padding='$3'
				gap='$3'
				pressStyle={{ opacity: 0.6 }}
				animation='quick'
				onPress={() => toggleGenre(item.Id!)}
			>
				<ItemImage item={item} width='$11' height='$11' />
				<YStack flex={1}>
					<Text bold>{genreName}</Text>
					{item.SongCount !== undefined && (
						<Text color='$borderColor'>{`${item.SongCount} tracks`}</Text>
					)}
				</YStack>
				<Icon
					name={isSelected ? 'check-circle-outline' : 'circle-outline'}
					color={isSelected ? '$primary' : '$borderColor'}
				/>
			</XStack>
		)
	}

	const keyExtractor = (item: BaseItemDto | string, index: number) => {
		if (typeof item === 'string') {
			return `header-${item}`
		}
		return item.Id ?? `genre-${index}`
	}

	if (isPending && !genres) {
		return (
			<YStack flex={1} alignItems='center' justifyContent='center'>
				<Spinner size='large' />
			</YStack>
		)
	}

	return (
		<YStack flex={1} backgroundColor='$background'>
			<XStack
				justifyContent='space-between'
				alignItems='center'
				padding='$4'
				borderBottomWidth={1}
				borderBottomColor='$borderColor'
			>
				<Button variant='outlined' size='$3' onPress={() => navigation.goBack()}>
					Cancel
				</Button>
				<Text bold fontSize='$6'>
					Select Genres
				</Text>
				<Button
					variant='outlined'
					size='$3'
					onPress={handleClear}
					disabled={selectedGenreIds.length === 0}
				>
					Clear
				</Button>
			</XStack>

			<FlashList
				data={flattenedGenres}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				// @ts-expect-error - estimatedItemSize is required by FlashList but types are incorrect
				estimatedItemSize={70}
				onEndReached={() => {
					if (hasNextPage && !isFetchingNextPage) {
						fetchNextPage()
					}
				}}
				ListEmptyComponent={
					<YStack flex={1} justifyContent='center' alignItems='center' padding='$4'>
						<Text color='$borderColor'>No genres found</Text>
					</YStack>
				}
			/>

			{selectedGenreIds.length > 0 && (
				<XStack
					justifyContent='space-evenly'
					alignItems='center'
					padding='$4'
					borderTopWidth={1}
					borderTopColor='$borderColor'
				>
					<Text
						fontSize='$3'
						bold
						color='$primary'
					>{`${selectedGenreIds.length} selected`}</Text>
					<Button
						variant='outlined'
						borderColor='$primary'
						color='$primary'
						size='$3'
						onPress={handleSave}
					>
						Apply
					</Button>
				</XStack>
			)}
		</YStack>
	)
}
