import { Api } from '@jellyfin/sdk'
import { fetch } from 'react-native-nitro-fetch'

const PATRON_API_ENDPOINT = 'https://patrons.jellify.app'

interface Patron {
	fullName: string
}

export default async function fetchPatrons(api: Api | undefined): Promise<Patron[]> {
	return new Promise((resolve, reject) => {
		if (!api) return reject(new Error('No API instance provided'))

		fetch(PATRON_API_ENDPOINT)
			.then(async (res) => {
				if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
				const patrons = (await res.json()) as Patron[]
				resolve(patrons)
			})
			.catch((err) => reject(err))
	})
}
