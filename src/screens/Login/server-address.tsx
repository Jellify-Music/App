import React, { useEffect, useState } from 'react'
import { isEmpty, isUndefined } from 'lodash'
import { Input, ListItem, Separator, Spinner, XStack, YGroup, YStack } from 'tamagui'
import { SwitchWithLabel } from '../../components/Global/helpers/switch-with-label'
import { H2, Text } from '../../components/Global/helpers/text'
import Button from '../../components/Global/helpers/button'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Toast from 'react-native-toast-message'
import Icon from '../../components/Global/components/icon'
import { IS_MAESTRO_BUILD } from '../../configs/config'
import { sleepify } from '../../utils/sleep'
import LoginStackParamList from './types'
import { useSendMetricsSetting } from '../../stores/settings/app'
import usePublicSystemInfo from '../../api/mutations/public-system-info'
import HTTPS, { HTTP } from '../../constants/protocols'
import { JellifyServer } from '@/src/types/JellifyServer'
import { useSignOut } from '../../stores'

export default function ServerAddress({
	navigation,
}: {
	navigation: NativeStackNavigationProp<LoginStackParamList>
}): React.JSX.Element {
	const [serverAddressContainsProtocol, setServerAddressContainsProtocol] =
		useState<boolean>(false)
	const [serverAddressContainsHttps, setServerAddressContainsHttps] = useState<boolean>(false)

	const [useHttps, setUseHttps] = useState<boolean>(true)
	const [serverAddress, setServerAddress] = useState<string | undefined>(undefined)

	const signOut = useSignOut()

	const [sendMetrics, setSendMetrics] = useSendMetricsSetting()

	useEffect(() => {
		setServerAddressContainsProtocol(
			!isUndefined(serverAddress) &&
				(serverAddress.includes(HTTP) || serverAddress.includes(HTTPS)),
		)
		setServerAddressContainsHttps(!isUndefined(serverAddress) && serverAddress.includes(HTTPS))
	}, [serverAddress])

	useEffect(() => {
		sleepify(1000).then(() => signOut())
	}, [])

	const { mutate: connectToServer, isPending } = usePublicSystemInfo({
		onSuccess: (server: JellifyServer) => {
			navigation.navigate('ServerAuthentication')
		},
		onError: () => {
			Toast.show({
				text1: 'Unable to connect',
				text2: ` at ${
					serverAddressContainsProtocol ? '' : useHttps ? HTTPS : HTTP
				}${serverAddress}`,
				type: 'error',
			})
		},
	})

	return (
		<SafeAreaView style={{ flex: 1 }}>
			<YStack maxHeight={'$19'} flex={1} justifyContent='center'>
				<H2 marginHorizontal={'$10'} textAlign='center'>
					Connect to Jellyfin
				</H2>
			</YStack>

			<YStack marginHorizontal={'$4'} gap={'$4'}>
				<XStack alignItems='center'>
					{!serverAddressContainsProtocol && (
						<Text
							borderColor={'$borderColor'}
							borderWidth={'$0.5'}
							borderRadius={'$4'}
							padding={'$2'}
							paddingTop={'$2.5'}
							width={'$6'}
							height={'$4'}
							marginRight={'$2'}
							color={useHttps ? '$success' : '$borderColor'}
							textAlign='center'
							verticalAlign={'center'}
						>
							{useHttps ? HTTPS : HTTP}
						</Text>
					)}

					<Input
						onChangeText={setServerAddress}
						autoCapitalize='none'
						autoCorrect={false}
						secureTextEntry={IS_MAESTRO_BUILD} // If Maestro build, don't show the server address as screen Records
						flex={1}
						placeholder='jellyfin.org'
						testID='server_address_input'
					/>
				</XStack>

				<YGroup
					gap={'$2'}
					borderColor={'$borderColor'}
					borderWidth={'$0.5'}
					borderRadius={'$4'}
				>
					<YGroup.Item>
						<ListItem
							icon={
								<Icon
									name={
										serverAddressContainsHttps || useHttps
											? 'lock-check'
											: 'lock-open'
									}
									color={
										serverAddressContainsHttps || useHttps
											? '$success'
											: '$borderColor'
									}
								/>
							}
							title='HTTPS'
							subTitle='Use HTTPS to connect to Jellyfin'
							disabled={serverAddressContainsProtocol}
						>
							<SwitchWithLabel
								checked={serverAddressContainsHttps || useHttps}
								onCheckedChange={(checked) => setUseHttps(checked)}
								label={
									serverAddressContainsHttps || useHttps
										? 'Use HTTPS'
										: 'Use HTTP'
								}
								size='$2'
								width={100}
							/>
						</ListItem>
					</YGroup.Item>

					<Separator />

					<YGroup.Item>
						<ListItem
							icon={
								<Icon
									name={sendMetrics ? 'bug-check' : 'bug'}
									color={sendMetrics ? '$success' : '$borderColor'}
								/>
							}
							title='Submit Usage and Crash Data'
							subTitle='Send anonymized metrics and crash data'
						>
							<SwitchWithLabel
								checked={sendMetrics}
								onCheckedChange={(checked) => setSendMetrics(checked)}
								label='Send Metrics'
								size='$2'
								width={100}
							/>
						</ListItem>
					</YGroup.Item>
				</YGroup>

				{isPending ? (
					<Spinner />
				) : (
					<Button
						disabled={isEmpty(serverAddress)}
						onPress={() => {
							if (!isUndefined(serverAddress))
								connectToServer({ serverAddress, useHttps })
						}}
						testID='connect_button'
					>
						Connect
					</Button>
				)}
			</YStack>
		</SafeAreaView>
	)
}
