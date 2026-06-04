import { FlashList } from '@shopify/flash-list'
import React from 'react'
import { useDevices } from 'react-native-google-cast'
import CastDevice from './device'

export default function CastDialog(): React.JSX.Element {
	const devices = useDevices()

	return <FlashList data={devices} renderItem={CastDevice} />
}
