import CastContext from 'react-native-google-cast'
import { onCastStateChanged, onSessionStarted } from './event-handlers'
import { EmitterSubscription } from 'react-native'

export default function registerCast() {
	return registerCastHandlers()
}

function registerCastHandlers(): EmitterSubscription[] {
	const castStateListener = CastContext.onCastStateChanged(onCastStateChanged)

	const sessionEventListener = CastContext.getSessionManager().onSessionStarted(onSessionStarted)

	return [castStateListener]
}
