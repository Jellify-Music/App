import React from 'react'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { BaseStackParamList } from '@/src/screens/types'
import ArtistOverviewTab from './OverviewTab'

export default function ArtistNavigation({
	navigation,
}: {
	navigation: NativeStackNavigationProp<BaseStackParamList>
}): React.JSX.Element {
	return <ArtistOverviewTab navigation={navigation} />
}
