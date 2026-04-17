import type { InternalAxiosRequestConfig } from 'axios'

/**
 * Tests for the custom Axios adapter that wraps react-native-nitro-fetch.
 *
 * We override the shared jest/setup/nitro-fetch.ts mock here to make sure the
 * `fetch` named export (which is re-exported from `nitroFetch`) is a jest
 * mock we can drive per-test.
 */

const mockFetch = jest.fn()

jest.mock('react-native-nitro-fetch', () => ({
	fetch: mockFetch,
	nitroFetch: mockFetch,
	nitroFetchOnWorklet: jest.fn(),
}))

// Import AFTER jest.mock so the adapter gets the mocked module.
const { nitroAxiosAdapter } = require('../../src/configs/axios.config')

type FakeResponse = {
	status: number
	statusText: string
	headers: Headers
	text: () => Promise<string>
}

function buildResponse(
	body: string,
	options: { status?: number; contentType?: string } = {},
): FakeResponse {
	const headers = new Headers()
	if (options.contentType) headers.set('content-type', options.contentType)
	return {
		status: options.status ?? 200,
		statusText: options.status === 200 || !options.status ? 'OK' : 'Error',
		headers,
		text: async () => body,
	}
}

const baseConfig: InternalAxiosRequestConfig = {
	url: 'https://example.test/api',
	method: 'get',
	headers: {} as never,
}

describe('nitroAxiosAdapter', () => {
	beforeEach(() => {
		mockFetch.mockReset()
	})

	it('parses JSON when the response declares application/json', async () => {
		mockFetch.mockResolvedValueOnce(
			buildResponse('{"ok":true,"count":3}', { contentType: 'application/json' }),
		)

		const response = await nitroAxiosAdapter(baseConfig)
		expect(response.status).toBe(200)
		expect(response.data).toEqual({ ok: true, count: 3 })
	})

	it('parses JSON when content-type casing varies or has parameters', async () => {
		mockFetch.mockResolvedValueOnce(
			buildResponse('{"ok":true}', { contentType: 'Application/JSON; charset=utf-8' }),
		)

		const response = await nitroAxiosAdapter(baseConfig)
		expect(response.data).toEqual({ ok: true })
	})

	it('parses JSON for +json suffix media types (e.g. application/vnd.api+json)', async () => {
		mockFetch.mockResolvedValueOnce(
			buildResponse('{"data":{"id":"1"}}', { contentType: 'application/vnd.api+json' }),
		)

		const response = await nitroAxiosAdapter(baseConfig)
		expect(response.data).toEqual({ data: { id: '1' } })
	})

	it('returns raw text for non-JSON content types', async () => {
		mockFetch.mockResolvedValueOnce(
			buildResponse('<html><body>502 Bad Gateway</body></html>', {
				status: 502,
				contentType: 'text/html',
			}),
		)

		const response = await nitroAxiosAdapter(baseConfig)
		expect(response.status).toBe(502)
		expect(response.data).toBe('<html><body>502 Bad Gateway</body></html>')
	})

	it('returns raw text for plain text error bodies on non-2xx responses', async () => {
		mockFetch.mockResolvedValueOnce(
			buildResponse('Error: connection refused', { status: 503, contentType: 'text/plain' }),
		)

		const response = await nitroAxiosAdapter(baseConfig)
		expect(response.status).toBe(503)
		expect(response.data).toBe('Error: connection refused')
	})

	it('throws a descriptive error when a 2xx response declares JSON but body is invalid', async () => {
		mockFetch.mockResolvedValueOnce(
			buildResponse('Error parsing internal state', {
				status: 200,
				contentType: 'application/json',
			}),
		)

		const promise = nitroAxiosAdapter(baseConfig)
		await expect(promise).rejects.toThrow(
			/Failed to parse JSON response from https:\/\/example\.test\/api \(HTTP 200\).+Body starts with: Error parsing internal state/,
		)
	})

	it('does NOT throw when a non-2xx response declares JSON but body is invalid — keeps raw text', async () => {
		mockFetch.mockResolvedValueOnce(
			buildResponse('Error: upstream timeout', {
				status: 504,
				contentType: 'application/json',
			}),
		)

		const response = await nitroAxiosAdapter(baseConfig)
		expect(response.status).toBe(504)
		expect(response.data).toBe('Error: upstream timeout')
	})

	it('returns null data for empty response bodies', async () => {
		mockFetch.mockResolvedValueOnce(buildResponse('', { status: 204 }))

		const response = await nitroAxiosAdapter(baseConfig)
		expect(response.status).toBe(204)
		expect(response.data).toBeNull()
	})

	it('exposes response headers back to Axios', async () => {
		mockFetch.mockResolvedValueOnce(
			buildResponse('{"ok":true}', { contentType: 'application/json' }),
		)

		const response = await nitroAxiosAdapter(baseConfig)
		expect(response.headers['content-type']).toBe('application/json')
	})
})
