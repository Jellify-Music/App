import { SizableText, XStack, YStack } from 'tamagui'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { reloadApp } from 'react-native-nitro-ota'
import Button from '../Global/utils/button'
import Icon from '../Global/components/icon'

interface OtaProps {
	pullRequest?: boolean | undefined
}

export default function Ota({ pullRequest }: OtaProps): React.JSX.Element {
	const { t } = useTranslation()

	const navigation = useNavigation()

	const { bottom } = useSafeAreaInsets()

	return (
		<YStack gap='4' marginBottom={bottom} marginHorizontal='4' marginTop={'6'}>
			<YStack gap='2' alignItems='center'>
				<SizableText fontWeight='6' size='6' textAlign='center'>
					{t(pullRequest ? 'ota.prUpdated' : 'ota.updated')}
				</SizableText>
				<SizableText textAlign='center'>{t('ota.restartInstructions')}</SizableText>
			</YStack>
			<XStack justifyContent='space-evenly' gap='2'>
				<Button
					onPress={() => navigation.goBack()}
					flex={1}
					borderWidth={'1'}
					borderColor={'borderColor'}
					icon={() => <Icon name='chevron-left' size='7' color={'borderColor'} />}
				>
					<SizableText fontWeight='6' color={'borderColor'}>
						{t('common.cancel')}
					</SizableText>
				</Button>
				<Button
					onPress={() => reloadApp()}
					flex={1}
					borderWidth={'1'}
					borderColor={'primary'}
					icon={() => <Icon name='restart' size='7' color={'primary'} />}
				>
					<SizableText fontWeight='6' color={'primary'}>
						{t('ota.restart')}
					</SizableText>
				</Button>
			</XStack>
		</YStack>
	)
}
