import React from 'react'
import { getToken, ScrollView } from 'tamagui'
import RecentlyAdded from './helpers/just-added'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { StackParamList } from '../types'
import { useDiscoverContext } from '../../providers/Discover'
import { RefreshControl } from 'react-native'

export default function Index({
	navigation,
}: {
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	const { refreshing, refresh } = useDiscoverContext()

	return (
		<ScrollView
			flexGrow={1}
			contentContainerStyle={{
				flexGrow: 1,
				marginTop: getToken('$4'),
			}}
			contentInsetAdjustmentBehavior='automatic'
			removeClippedSubviews
			paddingBottom={'$15'}
			refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
		>
			<RecentlyAdded navigation={navigation} />
		</ScrollView>
	)
}
