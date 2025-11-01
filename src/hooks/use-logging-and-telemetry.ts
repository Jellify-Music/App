import { useTelemetryDeck } from '@typedigital/telemetrydeck-react'
import { useSendMetricsSetting } from '../stores/settings/app'
import { useMutation } from '@tanstack/react-query'

const useLoggingAndTelemetry = () => {
	const [sendMetrics] = useSendMetricsSetting()

	return sendMetrics
}

interface SignalMutation {
	type: string

	payload?: never | undefined
}

export const useSignal = () => {
	const sendLoggingAndTelemetry = useLoggingAndTelemetry()

	const { signal } = useTelemetryDeck()

	return useMutation({
		onMutate: ({ type }) => {
			console.debug(`
                ${
					!sendLoggingAndTelemetry ? 'Logging disabled, will not send' : 'Sending'
				} signal 'Jellify: ${type}' signal to TelemetryDeck`)
		},
		mutationFn: async ({ type, payload }: SignalMutation) => {
			if (sendLoggingAndTelemetry) return await signal(`Jellify: ${type}`, payload)
			else return undefined
		},
		onError: (error, { type }) => {
			console.error(`Failed sending 'Jellify: ${type}' signal`, error)
		},
		onSuccess: (data, { type }) => {
			if (data)
				console.debug(`Successfully sent 'Jellify: ${type}' signal: ${data?.statusText}`)
		},
	})
}

export default useLoggingAndTelemetry
