import ItemDetail from '../../components/Detail/component'
import { StackParamList } from '../../components/types'
import { RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import React from 'react'

export default function DetailsScreen({
	route,
	navigation,
}: {
	route: RouteProp<StackParamList, 'Details'>
	navigation: NativeStackNavigationProp<StackParamList>
}): React.JSX.Element {
	return (
		<ItemDetail
			item={route.params.item}
			navigation={navigation}
			isNested={route.params.isNested}
		/>
	)
}
