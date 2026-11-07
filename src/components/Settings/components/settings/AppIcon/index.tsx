import React, { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { YStack, XStack, SizableText } from 'tamagui'
import { getActiveIcon, setIcon } from 'react-native-app-icon-changer'

import { AppIconConfig, AppIconValue } from '../../../../../types/Artwork/icon'
import { APP_ICONS } from '../../../../../configs/styling/icon'
import AppIconCard from './card'

export default function AppIconSettings(): React.JSX.Element {
	const [selected, setSelected] = useState<AppIconValue>('Default')

	useEffect(() => {
		getActiveIcon()
			.then((nativeName) => {
				const active = APP_ICONS.find((appIcon) => appIcon.nativeName === nativeName)
				if (active) setSelected(active.value)
			})
			.catch((error) => console.warn('Unable to get active app icon', error))
	}, [])

	const handleSelect = (appIcon: AppIconConfig) => {
		if (appIcon.value === selected) return

		const previous = selected
		setSelected(appIcon.value)

		setIcon(appIcon.nativeName).catch((error) => {
			console.warn('Unable to set app icon', error)
			setSelected(previous)
		})
	}

	return (
		<YStack gap='3'>
			<YStack>
				<SizableText fontSize='3' fontWeight='6'>
					App Icon
				</SizableText>
				{Platform.OS === 'android' && (
					<SizableText fontSize='2' color='borderColor'>
						Your new icon will appear after leaving the app
					</SizableText>
				)}
			</YStack>
			<XStack gap='2'>
				{APP_ICONS.map((appIcon) => (
					<AppIconCard
						key={appIcon.value}
						appIcon={appIcon}
						isSelected={selected === appIcon.value}
						onPress={() => handleSelect(appIcon)}
					/>
				))}
			</XStack>
		</YStack>
	)
}
