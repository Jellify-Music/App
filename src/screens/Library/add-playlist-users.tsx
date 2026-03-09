import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import LibraryStackParamList, { LibraryAddPlaylistUsers } from './types'
import { Paragraph, Text, View, XStack, YStack } from 'tamagui'
import { usePlaylistUsers } from '../../../src/api/queries/playlist'
import { useUsers } from '../../../src/api/queries/users'
import ItemImage from '../../../src/components/Global/components/image'
import TextTicker from 'react-native-text-ticker'
import { TextTickerConfig } from '../../../src/components/Player/component.config'
import { getItemName } from '../../../src/utils/formatting/item-names'
import { SectionList } from 'react-native'
import Icon from '../../../src/components/Global/components/icon'

//screen in react native
export default function addPlaylistUsers({
	navigation,
	route,
}: LibraryAddPlaylistUsers): React.JSX.Element {
	const { playlist } = route.params
	const {
		data: playlistUsers,
		isPending: playlistUserIsPending,
		refetch: refetchPlaylistUser,
	} = usePlaylistUsers(playlist) //make this playlist an easy access variable (with const variable above)
	const { data: users, isPending: useUsersIsPending, refetch: refetchUseUsers } = useUsers()

	//get string array of all playlist user IDs
	const playlistUserIds = playlistUsers?.map((playlistUser) => playlistUser.UserId) ?? []

	//if user exists in playlist already, do not display
	//take all users, filter any users that also appear in playlistUserIds
	const otherUsers = users?.filter((user) => playlistUserIds?.includes(user.Id)) ?? []

	//any user not included in listed users will get filtered out
	const usersInPlaylist = users?.filter((user) => !playlistUserIds?.includes(user.Id)) ?? []

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
		<View flex={1}>
			{
				//no conditional statement here (have to have a playlist to see this view anyways)
				<XStack gap={'$2'} margin={'$4'}>
					<ItemImage
						item={playlist}
						width={'$12'}
						height={'$12'}
						imageOptions={{ maxWidth: 85, maxHeight: 85, quality: 90 }}
					/>

					<YStack gap={'$2'}>
						<TextTicker {...TextTickerConfig}>
							<Paragraph fontWeight={'bold'} fontSize={'$6'}>
								{getItemName(playlist)}
							</Paragraph>
						</TextTicker>

						{/* <TextTicker {...TextTickerConfig}>
									<Text bold>
										{`${(source ?? tracks[0])!.ArtistItems?.map((artist) => getItemName(artist)).join(', ')}`}
									</Text>
								</TextTicker> */}
					</YStack>
				</XStack>
			}

			{/* conditional in react - only render if some variable meet criteria */}
			{
				//list of users and section list
				<SectionList
					sections={playlistUserData}
					renderItem={({ item: user }) => (
						<XStack>
							<ItemImage
								item={user}
								width={'$12'}
								height={'$12'}
								imageOptions={{ maxWidth: 85, maxHeight: 85, quality: 90 }}
							/>
							<Paragraph>{user.Name ?? 'Unknown User'}</Paragraph>
							{playlistUserIds.includes(user.Id) ? (
								<Icon name='account-remove' color='$warning' />
							) : (
								<Icon name='account-plus' color='$borderColor' />
							)}
						</XStack>
					)}
					keyExtractor={(item) => item.Id!}
				/>
			}
		</View>
	)
}
