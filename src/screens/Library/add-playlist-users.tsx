import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import LibraryStackParamList, { LibraryAddPlaylistUsers } from './types'
import { View } from 'tamagui'
import { usePlaylistUsers } from '@/src/api/queries/playlist'

//screen in react native
export default function addPlaylistUsers({
	navigation,
	route,
}: LibraryAddPlaylistUsers): React.JSX.Element {
	const result = usePlaylistUsers(route.params.playlist)
	//return component here
	return <View></View>
}
