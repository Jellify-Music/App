import React from 'react'
import Tracks from '../../components/Tracks/component'
import { DownloadedTracksProps, StackParamList } from '../../components/types'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

export default function DownloadedTracksScreen({
	navigation,
	route,
}: DownloadedTracksProps): React.JSX.Element {
	return (
		<Tracks
			navigation={navigation as unknown as NativeStackNavigationProp<StackParamList>}
			tracks={undefined}
			fetchNextPage={() => {}}
			hasNextPage={false}
			queue='Downloaded Tracks'
			filterDownloaded
		/>
	)
}
