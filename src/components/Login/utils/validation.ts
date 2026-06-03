import { isEmpty } from 'lodash'

export function validateServerUrl(serverUrl: string | undefined) {
	if (!isEmpty(serverUrl)) {
		// Parse
		return true
	}

	return false
}
