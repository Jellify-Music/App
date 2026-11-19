import { useMutation } from '@tanstack/react-query'
import { connectToServer } from './utils'
import type { SetServerParams } from '../../../stores/auth/types'
import useJellifyStore from '../../../stores/auth'
import type {
	ConnectToServerParams,
	PublicSystemInfoMutation,
	ConnectToServerResult,
} from './types'
import LoggingContext from '../../../utils/logging/enums'
import { handleError } from '../../../utils/errors'
import i18n from '../../../i18n'

const useConnectToServer = ({ onSuccess }: ConnectToServerParams) =>
	useMutation<ConnectToServerResult, Error, PublicSystemInfoMutation>({
		mutationFn: ({ serverAddress }) => connectToServer(serverAddress),
		onSuccess: ({ publicSystemInfoResponse, resolvedUrl }, { serverAddress }) => {
			if (!publicSystemInfoResponse.Version) throw new Error(i18n.t('login.noResponse'))

			if (!publicSystemInfoResponse.StartupWizardCompleted)
				throw new Error(i18n.t('login.notSetUp'))

			const server: SetServerParams = {
				url: resolvedUrl,
				address: serverAddress,
				publicSystemInfo: publicSystemInfoResponse,
			}

			useJellifyStore.getState().setServer(server)

			onSuccess?.(server)
		},
		onError: (error: Error, { serverAddress }) => {
			useJellifyStore.getState().setServer(undefined)

			handleError(
				error,
				LoggingContext.PublicSystemInfo,
				'connect',
				{ server: serverAddress },
				'Unable to connect to server',
			)
		},
	})

export default useConnectToServer
