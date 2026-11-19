import { Avatar, SizableText, XStack, YStack } from 'tamagui'
import Icon from '../../Global/components/icon'
import { getUserAvatarUrl } from '../../../api/queries/image/utils/avatar'
import { BaseItemDto, UserDto } from '@jellyfin/sdk/lib/generated-client'
import { useAddPlaylistUser, useRemovePlaylistUser } from '../../../api/queries/playlist'
import Animated, { useReducedMotion, ZoomIn, ZoomOut } from 'react-native-reanimated'
import AnimatedRow from '../../Global/utils/Animated/row'
import { useTranslation } from 'react-i18next'

interface UserShareRowProps {
	user: UserDto
	playlist: BaseItemDto
	playlistUserIds: ReadonlySet<string>
}

export default function UserShareRow({ user, playlistUserIds, playlist }: UserShareRowProps) {
	const { t } = useTranslation()

	const avatarUrl = getUserAvatarUrl(user)

	const isInPlaylist = user.Id && playlistUserIds.has(user.Id)

	//invoke mutations on icon press
	//add
	const addUser = useAddPlaylistUser()
	//remove
	const removeUser = useRemovePlaylistUser()

	const reducedMotion = useReducedMotion()

	const isPending = addUser.isPending || removeUser.isPending

	return (
		// Sharing moves the row between sections, which remounts it, so fade it into its new spot
		<AnimatedRow testID={`playlist-user-row-${user.Name}`}>
			<XStack alignItems='center' padding='2'>
				<Avatar circular size='3'>
					<Avatar.Image src={avatarUrl} />
					<Avatar.Fallback backgroundColor='primary'>
						<YStack alignItems='center' justifyContent='center' flex={1}>
							<Icon size='6' name='account' color='background' />
						</YStack>
					</Avatar.Fallback>
				</Avatar>

				<SizableText fontWeight='6' flex={1} padding={'$2'}>
					{user.Name ?? t('placeholders.unknownUser')}
				</SizableText>
				{/* Keyed on share state so the new icon pops in when the user is added or removed */}
				<Animated.View
					key={isInPlaylist ? 'shared' : 'not-shared'}
					entering={reducedMotion ? undefined : ZoomIn.springify()}
					exiting={reducedMotion ? undefined : ZoomOut.duration(150)}
					style={{ opacity: isPending ? 0.5 : 1 }}
				>
					{isInPlaylist ? ( //send playlist id and user id (with bang! because it likely won't be undefined)
						<Icon
							onPress={() =>
								!isPending && removeUser.mutate({ playlist: playlist, user: user })
							}
							name='check-circle-outline'
							testID={`playlist-user-remove-${user.Name}`}
							color='success'
						/>
					) : (
						//same stuff and canEdit as true bcs you know anyone you're sharing with
						<Icon
							onPress={() =>
								!isPending &&
								addUser.mutate({
									playlist: playlist,
									user: user,
									CanEdit: true,
								})
							}
							name='circle-outline'
							testID={`playlist-user-add-${user.Name}`}
							color='borderColor'
						/>
					)}
				</Animated.View>
			</XStack>
		</AnimatedRow>
	)
}
