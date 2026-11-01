import { YStack } from 'tamagui'
import SendMetricsAndCrashDataSetting from '../../Settings/components/settings/send-metrics-and-crash-data'
import Input from '../../Global/helpers/input'
import { IS_MAESTRO_BUILD } from '../../../configs/config'
import { DEFAULT_SERVER_ADDRESS } from '../../../configs/defaults.config'

interface AddressInputProps {
	setServerAddress: (address: string) => void
	connectWithAddress: () => void
}

export default function AddressInput({ setServerAddress, connectWithAddress }: AddressInputProps) {
	return (
		<YStack gap='2'>
			<Input
				onChangeText={setServerAddress}
				autoCapitalize='none'
				autoCorrect={false}
				secureTextEntry={IS_MAESTRO_BUILD} // If Maestro build, don't show the server address as screen Records
				placeholder={DEFAULT_SERVER_ADDRESS}
				testID='server_address_input'
				returnKeyType='done'
				onSubmitEditing={connectWithAddress}
				title='Jellyfin Server Address'
				tabIndex={0}
			/>

			<SendMetricsAndCrashDataSetting />
		</YStack>
	)
}
