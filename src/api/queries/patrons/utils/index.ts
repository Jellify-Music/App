import { Api } from '@jellyfin/sdk'

const PATRON_API_ENDPOINT = 'https://patrons.jellify.app'

interface Patron {
	fullName: string
}

export default async function fetchPatrons(api: Api | undefined): Promise<Patron[]> {
	return new Promise((resolve, reject) => {
		if (!api) return reject(new Error('No API instance provided'))

		api.axiosInstance
			.get(PATRON_API_ENDPOINT)
			.then((res) => {
				const patrons = res.data as Patron[]
				resolve(patrons)
			})
			.catch((err) => reject(err))
	})
}
