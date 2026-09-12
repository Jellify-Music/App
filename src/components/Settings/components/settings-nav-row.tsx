import React from 'react'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

import { SettingsStackParamList } from '../../../screens/Settings/types'
import NavRowCard, { NavRowCardProps } from '../../Global/components/nav-row-card'

export default function SettingsNavRow({
	route,
	...props
}: NavRowCardProps<SettingsStackParamList>): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>()

	const onPress = () => navigation.navigate(route)

	return <NavRowCard onPress={onPress} {...props} />
}
