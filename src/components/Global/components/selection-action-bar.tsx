import React from 'react'
import { Button, XStack, YStack } from 'tamagui'
import Icon from './icon'
import { Text } from '../helpers/text'

export default function SelectionActionBar({
	selectedCount,
	onAddToPlaylist,
	onClear,
	bottomInset,
}: {
	selectedCount: number
	onAddToPlaylist: () => void
	onClear: () => void
	bottomInset: number
}): React.JSX.Element {
	return (
		<XStack
			paddingHorizontal={'$4'}
			paddingVertical={'$3'}
			borderTopColor={'$borderColor'}
			borderTopWidth={1}
			backgroundColor={'$background'}
			gap={'$3'}
			alignItems='center'
			position='absolute'
			bottom={bottomInset + 8}
			left={0}
			right={0}
			elevation={4}
		>
			<YStack flex={1}>
				<Text bold>{`${selectedCount} selected`}</Text>
				<Text color={'$borderColor'}>Add selected tracks to a playlist</Text>
			</YStack>

			<XStack gap={'$2'}>
				<Button variant='outlined' onPress={onClear}>
					Clear
				</Button>
				<Button
					backgroundColor={'$primary'}
					color={'$background'}
					onPress={onAddToPlaylist}
					icon={<Icon name='playlist-plus' color={'$background'} />}
				>
					Add to Playlist
				</Button>
			</XStack>
		</XStack>
	)
}
