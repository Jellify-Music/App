import { useState } from 'react'
import { LinearTransition } from 'react-native-reanimated'
import { partition } from 'lodash'
import type { UserDto } from '@jellyfin/sdk/lib/generated-client'
import { Input, SizableText, View } from 'tamagui'
import UserShareRow from '../../components/SharePlaylist/components/user-row'
import { usePlaylistUsers } from '../../../src/api/queries/playlist'
import { useUsers } from '../../../src/api/queries/users'
import { AddPlaylistUsersProps } from '../types'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AnimatedList } from '../../components/Global/components/Lists/utils'
import { LegendListRenderItemProps } from '@legendapp/list/react-native'

//screen in react native
export default function addPlaylistUsers({ route }: AddPlaylistUsersProps): React.JSX.Element {
	const [searchQuery, setSearchQuery] = useState('')
	const { playlist } = route.params
	const {
		data: playlistUsers,
		isPending: playlistUserIsPending,
		refetch: refetchPlaylistUser,
	} = usePlaylistUsers(playlist) //make this playlist an easy access variable (with const variable above)
	const { data: users, isPending: useUsersIsPending, refetch: refetchUseUsers } = useUsers()
	const { bottom } = useSafeAreaInsets()

	//set of all playlist user IDs
	const playlistUserIds = new Set(playlistUsers?.flatMap(({ UserId }) => UserId ?? []))

	//apply search filter
	const query = searchQuery.trim().toLowerCase()
	const searchedUsers = query
		? users?.filter((user) => user.Name?.toLowerCase().includes(query))
		: users

	//split users into those already in the playlist and everyone else
	const [usersInPlaylist, otherUsers] = partition(
		searchedUsers,
		(user) => !!user.Id && playlistUserIds.has(user.Id),
	)

	const renderUserRow = ({ item: user }: LegendListRenderItemProps<UserDto>) => (
		<UserShareRow user={user} playlistUserIds={playlistUserIds} playlist={playlist} />
	)

	//return component here
	return (
		//return view that occupies full screen
		<View flex={1}>
			{/* list of users and section list */}
			<AnimatedList<UserDto>
				nestedScrollEnabled
				ListHeaderComponent={
					<SizableText fontWeight='6' fontSize='3'>
						{' '}
						Users{' '}
					</SizableText>
				}
				renderItem={renderUserRow}
				contentContainerStyle={{
					margin: 8,
					paddingBottom: bottom,
				}}
				data={usersInPlaylist}
				itemLayoutAnimation={LinearTransition.springify()}
			/>
			{/* search bar */}
			<View padding={'$4'} paddingBottom={'$2'}>
				<Input
					placeholder='Search users by name...'
					testID='playlist-users-search-input'
					value={searchQuery}
					onChangeText={setSearchQuery}
					clearButtonMode='while-editing'
					rows={1}
				/>
			</View>
		</View>
	)
}
