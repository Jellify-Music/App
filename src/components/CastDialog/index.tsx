import React from 'react'
// Google Cast device list removed — nitro-player's CastButton opens the native
// Cast device picker directly, so this custom RNGC device dialog is unused.
// import { Device, useCastDevice, useDevices } from 'react-native-google-cast'
// import CastDevice from './device'
// import { LegendList, LegendListRenderItemProps } from '@legendapp/list/react-native'
import { Paragraph, YStack } from 'tamagui'
import Icon from '../Global/components/icon'

export default function CastDialog(): React.JSX.Element {
	// const devices = useDevices()
	// const currentDevice = useCastDevice()
	// const renderItem = ({ item }: LegendListRenderItemProps<Device>) => (
	// 	<CastDevice device={item} isActive={currentDevice?.deviceId === item.deviceId} />
	// )
	// return (
	// 	<LegendList
	// 		contentInsetAdjustmentBehavior='automatic'
	// 		data={devices}
	// 		ListEmptyComponent={CastDialogNoDevices}
	// 		renderItem={renderItem}
	// 	/>
	// )

	return <CastDialogNoDevices />
}

function CastDialogNoDevices() {
	return (
		<YStack justifyContent='center' alignContent='center'>
			<Icon large name='speaker-off' />
			<Paragraph fontWeight={'$6'}>Use the Cast button to pick a device</Paragraph>
		</YStack>
	)
}
