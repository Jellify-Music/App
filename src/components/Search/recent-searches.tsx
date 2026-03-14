import React from 'react'
import { XStack, YStack } from 'tamagui'
import { Text } from '../Global/helpers/text'
import Icon from '../Global/components/icon'
import { useSearchStore } from '../../stores/search'

interface RecentSearchesProps {
	onSelect: (term: string) => void
}

export default function RecentSearches({
	onSelect,
}: RecentSearchesProps): React.JSX.Element | null {
	const recentSearches = useSearchStore((s) => s.recentSearches)
	const removeRecentSearch = useSearchStore((s) => s.removeRecentSearch)
	const clearRecentSearches = useSearchStore((s) => s.clearRecentSearches)

	if (recentSearches.length === 0) return null

	return (
		<YStack gap={'$2'} paddingVertical={'$2'}>
			<XStack justifyContent='space-between' alignItems='center'>
				<Text bold fontSize={'$6'}>
					Recent Searches
				</Text>
				<Text color={'$primary'} fontSize={'$3'} onPress={clearRecentSearches}>
					Clear
				</Text>
			</XStack>

			{recentSearches.map((term) => (
				<XStack
					key={term}
					alignItems='center'
					justifyContent='space-between'
					paddingVertical={'$1.5'}
					onPress={() => onSelect(term)}
					pressStyle={{ opacity: 0.6 }}
				>
					<XStack alignItems='center' gap={'$2'} flex={1}>
						<Icon name='history' xsmall color={'$borderColor'} />
						<Text numberOfLines={1}>{term}</Text>
					</XStack>
					<Icon
						name='close'
						xsmall
						color={'$borderColor'}
						onPress={() => removeRecentSearch(term)}
					/>
				</XStack>
			))}
		</YStack>
	)
}
