import { Api } from '@jellyfin/sdk'
import { AuthenticationResult } from '@jellyfin/sdk/lib/generated-client'
import { getUserApi } from '@jellyfin/sdk/lib/utils/api'
import { isUndefined } from 'lodash'

export default function authenticateUserByName(
	api: Api | undefined,
	username: string,
	password: string | undefined,
): Promise<AuthenticationResult> {
	return new Promise((resolve, reject) => {
		getUserApi(api!)
			.authenticateUserByName({
				authenticateUserByName: {
					Username: username,
					Pw: password,
				},
			})
			.then(({ data, status }) => {
				if (status === 401 || isUndefined(data.AccessToken))
					return reject(new Error('Invalid credentials'))

				if (isUndefined(data.User)) return reject(new Error('Invalid credentials'))

				return resolve(data)
			})
			.catch((error: Error) => {
				if (error.message.includes('401')) return reject(new Error('Invalid credentials'))

				return reject(error)
			})
	})
}
