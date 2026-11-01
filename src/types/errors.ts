/**
 * Error thrown when the API client is not available.
 */
export class ApiNotAvailableError extends Error {
	constructor() {
		super('API client not available')
		this.name = 'ApiNotAvailableError'
	}
}
/**
 * Error thrown when the server address is not available.
 */
export class ServerAddressNotAvailableError extends Error {
	constructor() {
		super('Server Address not available')
		this.name = 'ServerAddressNotAvailableError'
	}
}
