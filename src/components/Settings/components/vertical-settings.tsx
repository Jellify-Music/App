import React from 'react'
import { ScrollView, YStack } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'

import Icon from '../../Global/components/icon'
import Button from '../../Global/helpers/button'
import StatusBar from '../../Global/helpers/status-bar'
import { SettingsStackParamList } from '../../../screens/Settings/types'

import {
	UserProfileHeader,
	AppearanceSection,
	GesturesSection,
	PlaybackSection,
	StorageSection,
	PrivacySection,
	DeveloperSection,
	AboutSection,
} from './sections'

export default function VerticalSettings(): React.JSX.Element {
	const { top } = useSafeAreaInsets()
	const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList>>()

	return (
		<YStack flex={1} backgroundColor='$background'>
			<YStack height={top} backgroundColor='$primary' />
			<StatusBar invertColors />

			<ScrollView
				contentContainerStyle={{ paddingBottom: 160 }}
				showsVerticalScrollIndicator={false}
			>
				<UserProfileHeader />
				<AppearanceSection />
				<GesturesSection />
				<PlaybackSection />
				<StorageSection />
				<PrivacySection />
				<DeveloperSection />
				<AboutSection />

				{/* Sign Out Button */}
				<YStack paddingHorizontal='$3' paddingVertical='$4'>
					<Button
						size='$4'
						backgroundColor='$danger'
						color='$background'
						onPress={() => navigation.navigate('SignOut')}
						icon={<Icon name='logout' color='$background' />}
					>
						Sign Out
					</Button>
				</YStack>
			</ScrollView>
		</YStack>
	)
}
