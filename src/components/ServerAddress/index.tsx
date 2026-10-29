import { SizableText, Spinner, YStack } from 'tamagui'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import LoginStackParamList from '../../screens/Login/types'
import { useEffect, useState } from 'react'
import { useSignOut } from '../../stores/auth'
import { isEmpty } from 'lodash'
import useConnectToServer from '../../api/mutations/public-system-info'
import { JellyfinServer } from '../../types/JellyfinServer'
import { sleepify } from '../../utils/sleep'
import Toast from 'react-native-toast-message'
import Button from '../Global/helpers/button'
import AddressInput from '../ServerAddress/components/address-input'
import Heading from '../ServerAddress/components/heading'

export default function ServerAddress(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<LoginStackParamList>>()

	const [serverAddress, setServerAddress] = useState<string | undefined>(undefined)

	const signOut = useSignOut()

	useEffect(() => {
		sleepify(1000).then(() => signOut())
	}, [])

	const { mutate: connectToServer, isPending } = useConnectToServer({
		onSuccess: (server: JellyfinServer) => navigation.navigate('ServerAuthentication'),
		onError: () =>
			Toast.show({
				text1: 'Unable to connect',
				text2: `to ${serverAddress}`,
				type: 'error',
			}),
	})

	const connectWithAddress = () => {
		if (serverAddress !== undefined && serverAddress.length > 0)
			connectToServer({ serverAddress })
	}

	return (
		<YStack
			flex={1}
			gap='2'
			justifyContent='center'
			marginHorizontal='4'
			testID='server_address_screen'
		>
			<Heading />

			<AddressInput
				setServerAddress={setServerAddress}
				connectWithAddress={connectWithAddress}
			/>

			<Button
				backgroundColor={`${isEmpty(serverAddress) || isPending ? 'neutral' : 'primary'}`}
				onPress={connectWithAddress}
				testID='connect_button'
				flexShrink={1}
			>
				{isPending ? (
					<Spinner color='background' />
				) : (
					<SizableText color='background' fontSize='2' fontWeight='6'>
						Connect
					</SizableText>
				)}
			</Button>
		</YStack>
	)
}
