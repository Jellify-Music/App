import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import LibraryStackParamList, { LibraryAddPlaylistUsers } from './types'
import { View } from 'tamagui'
import { usePlaylistUsers } from '../../../src/api/queries/playlist'
import { useUsers } from '../../../src/api/queries/users'

//screen in react native
export default function addPlaylistUsers({
	navigation,
	route,
}: LibraryAddPlaylistUsers): React.JSX.Element {
	const {
		data: playlistUsers,
		isPending: playlistUserIsPending,
		refetch: refetchPlaylistUser,
	} = usePlaylistUsers(route.params.playlist)
	const { data: users, isPending: useUsersIsPending, refetch: refetchUseUsers } = useUsers()

	//get string array of all playlist user IDs
	const playlistUserIds = playlistUsers?.map((playlistUser) => playlistUser.UserId)

	//if user exists in playlist already, do not display
	//take all users, filter any users that also appear in playlistUserIds
	const otherUsers = users?.filter((user) => playlistUserIds?.includes(user.Id))

	//return component here
	return <View></View>
}
