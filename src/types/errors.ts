/**
 * Error thrown when the API client is not available.
 */
export class ApiNotAvailableError extends Error {
	constructor() {
		super('API client instance not available')
		this.name = 'ApiNotAvailableError'
	}
}

/**
 * Error thrown when the user instance is not available.
 */
export class UserNotAvailableError extends Error {
	constructor() {
		super('User instance not available')
		this.name = 'UserNotAvailableError'
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
