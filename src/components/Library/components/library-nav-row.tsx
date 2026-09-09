import { useNavigation } from '@react-navigation/native'
import { LibraryStackParamList } from '../../../screens/Library/types'
import NavRowCard, { NavRowCardProps } from '../../Global/components/nav-row-card'
import React from 'react'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

export default function LibraryNavRow({
	route,
	...props
}: NavRowCardProps<LibraryStackParamList>): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<LibraryStackParamList>>()

	const onPress = () => navigation.navigate(route)

	return <NavRowCard onPress={onPress} {...props} />
}
