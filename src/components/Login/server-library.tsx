import { useInitiateQuickConnect } from '../../api/mutations/quickconnect'
import LoginStackParamList from '../../screens/Login/types'
import { useJellifyLibrary } from '../../stores/auth'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { CommonActions, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import LibrarySelector from '../Global/components/library-selector'
import { Button, Paragraph, XStack, YStack } from 'tamagui'
import Icon from '../Global/components/icon'
import { ICON_PRESS_STYLES } from '../../configs/style.config'
import navigationRef from '../../screens/navigation'

export default function ServerLibrary(): React.JSX.Element {
	const [, setLibrary] = useJellifyLibrary()

	const navigation = useNavigation<NativeStackNavigationProp<LoginStackParamList>>()

	const initiateQuickConnect = useInitiateQuickConnect()

	const handleLibrarySelected = (libraryId: string, selectedLibrary: BaseItemDto) => {
		setLibrary({
			musicLibraryId: libraryId,
			musicLibraryName: selectedLibrary.Name ?? 'No library name',
			musicLibraryPrimaryImageId: selectedLibrary.ImageTags?.Primary,
		})

		navigationRef.navigate('Tabs')
	}

	const handleCancel = () => {
		initiateQuickConnect.reset()
		navigation.navigate('ServerAuthentication', undefined, {
			merge: true,
			pop: true,
		})
	}

	return (
		<YStack flex={1}>
			<XStack alignItems='center' flexShrink={1}>
				<Button
					marginVertical={0}
					icon={() => <Icon name='chevron-left' small />}
					borderRadius={'$4'}
					onPress={() => {
						navigation.navigate('ServerAuthentication', undefined, {
							merge: true,
							pop: true,
						})
					}}
					{...ICON_PRESS_STYLES}
				>
					<Paragraph fontWeight={'$6'}>Switch User</Paragraph>
				</Button>
			</XStack>

			<LibrarySelector
				onLibrarySelected={handleLibrarySelected}
				onCancel={handleCancel}
				primaryButtonText="Let's Go!"
				primaryButtonIcon='guitar-electric'
				showCancelButton={false}
				cancelButtonText='Switch User'
				cancelButtonIcon='chevron-left'
				isOnboarding={true}
			/>
		</YStack>
	)
}
