import React from 'react'
import {
	YStack,
	XStack,
	Button,
	Text,
	Separator,
	ListItem,
	ScrollView,
	getTokens,
	Sheet,
} from 'tamagui'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { useJellifyContext } from '../../../providers'
import { getImageApi } from '@jellyfin/sdk/lib/utils/api'
import Icon from './icon'
import FastImage from 'react-native-fast-image'

interface MultiSelectAddToPlaylistModalProps {
	isVisible: boolean
	onClose: () => void
	playlists: BaseItemDto[] | undefined
	onSelectPlaylist: (playlist: BaseItemDto) => void
	isLoading?: boolean
}

export default function MultiSelectAddToPlaylistModal({
	isVisible,
	onClose,
	playlists,
	onSelectPlaylist,
	isLoading,
}: MultiSelectAddToPlaylistModalProps): React.JSX.Element {
	const { api } = useJellifyContext()

	return (
		<Sheet
			modal
			open={isVisible}
			onOpenChange={(open: boolean) => !open && onClose()}
			snapPoints={[85]}
			position={0}
			dismissOnSnapToBottom
		>
			<Sheet.Overlay />
			<Sheet.Handle />
			<Sheet.Frame padding='$4'>
				<YStack gap='$3' flex={1}>
					<XStack justifyContent='space-between' alignItems='center'>
						<Text fontSize='$6' fontWeight='bold'>
							Add to Playlist
						</Text>
						<Button circular icon={<Icon name='close' />} onPress={onClose} size='$3' />
					</XStack>
					<Separator />
					<ScrollView flex={1}>
						<YStack gap='$2'>
							{playlists?.map((playlist) => (
								<ListItem
									key={playlist.Id}
									hoverTheme
									pressTheme
									onPress={() => onSelectPlaylist(playlist)}
									disabled={isLoading}
									padding='$3'
								>
									<XStack alignItems='center' gap='$3' flex={1}>
										<FastImage
											style={{
												width: getTokens().size['$4'].val,
												height: getTokens().size['$4'].val,
												borderRadius: getTokens().radius['$2'].val,
											}}
											source={{
												uri: getImageApi(api!).getItemImageUrlById(
													playlist.Id!,
												),
											}}
										/>
										<YStack flex={1}>
											<Text fontWeight='bold'>{playlist.Name}</Text>
											<Text
												fontSize='$3'
												color='$color10'
											>{`${playlist.ChildCount ?? 0} tracks`}</Text>
										</YStack>
									</XStack>
								</ListItem>
							))}
							{(!playlists || playlists.length === 0) && !isLoading && (
								<Text textAlign='center' padding='$4'>
									No playlists found.
								</Text>
							)}
						</YStack>
					</ScrollView>
					<Button onPress={onClose} variant='outlined'>
						Cancel
					</Button>
				</YStack>
			</Sheet.Frame>
		</Sheet>
	)
}
