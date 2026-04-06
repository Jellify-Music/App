import { Paragraph, View, XStack, YStack } from 'tamagui'
import {
	useAddPlaylistUser,
	usePlaylistUsers,
	useRemovePlaylistUser,
} from '../../../src/api/queries/playlist'
import { useUsers } from '../../../src/api/queries/users'
import ItemImage from '../../../src/components/Global/components/image'
import TextTicker from 'react-native-text-ticker'
import { TextTickerConfig } from '../../../src/components/Player/component.config'
import { getItemName } from '../../../src/utils/formatting/item-names'
import { SectionList } from 'react-native'
import Icon from '../../../src/components/Global/components/icon'
import TurboImage from 'react-native-turbo-image'
import getUserImageUrl from '../../utils/images/users'
import { AddPlaylistUsersProps } from '../types'
import { title } from 'node:process'
import { info } from 'node:console'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

//screen in react native
export default function addPlaylistUsers({
	navigation,
	route,
}: AddPlaylistUsersProps): React.JSX.Element {
	const { playlist } = route.params
	const {
		data: playlistUsers,
		isPending: playlistUserIsPending,
		refetch: refetchPlaylistUser,
	} = usePlaylistUsers(playlist) //make this playlist an easy access variable (with const variable above)
	const { data: users, isPending: useUsersIsPending, refetch: refetchUseUsers } = useUsers()
	const { bottom } = useSafeAreaInsets()

	//invoke mutations on icon press
	//add
	const addUser = useAddPlaylistUser()
	//remove
	const removeUser = useRemovePlaylistUser()

	//get string array of all playlist user IDs
	const playlistUserIds = playlistUsers?.map((playlistUser) => playlistUser.UserId) ?? []

	//if user exists in playlist already, do not display
	//take all users, filter any users that also appear in playlistUserIds
	const otherUsers = users?.filter((user) => !playlistUserIds?.includes(user.Id)) ?? []

	//any user not included in listed users will get filtered out
	const usersInPlaylist = users?.filter((user) => playlistUserIds?.includes(user.Id)) ?? []

	//use formatting for sections component later on
	const playlistUserData = [
		{
			title: 'Shared With',
			data: usersInPlaylist,
		},
		{
			title: 'Users on Server',
			data: otherUsers,
		},
	]

	//return component here
	return (
		//return view that occupies full screen
		<View flex={1} padding={'$4'} marginBottom={bottom}>
			{/* conditional in react - only render if some variable meet criteria */}
			{
				//list of users and section list
				<SectionList
					sections={playlistUserData}
					renderSectionHeader={(info) => <Paragraph> {info.section.title} </Paragraph>}
					renderItem={({ item: user }) => (
						<XStack>
							<TurboImage
								source={{ uri: getUserImageUrl(user) }}
								style={{ width: 45, height: 45 }}
								rounded
							/>

							<Paragraph fontWeight='bold' flex={1} padding={'$2'}>
								{user.Name ?? 'Unknown User'}
							</Paragraph>
							{playlistUserIds.includes(user.Id) ? ( //send playlist id and user id (with bang! because it likely won't be undefined)
								<Icon
									onPress={() =>
										removeUser.mutate({ playlist: playlist, user: user })
									}
									name='account-remove'
									color='$warning'
								/>
							) : (
								//same stuff and canEdit as true bcs you know anyone you're sharing with
								<Icon
									onPress={() =>
										addUser.mutate({
											playlist: playlist,
											user: user,
											CanEdit: true,
										})
									}
									name='account-plus'
									color='$borderColor'
								/>
							)}
						</XStack>
					)}
					keyExtractor={(item) => item.Id!}
				/>
			}
		</View>
	)
}
