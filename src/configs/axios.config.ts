import axios from 'axios'

/**
 * The Axios instance for making HTTP requests.
 *
 * Default timeout is set to 15 seconds.
 */
const AXIOS_INSTANCE = axios.create({
	timeout: 15 * 1000, // 15 seconds
})

import { selfSignedAdapter } from '../utils/axios-adapter'

export const AXIOS_INSTANCE_SELF_SIGNED = axios.create({
	timeout: 15 * 1000, // 15 seconds
	adapter: selfSignedAdapter,
})

export default AXIOS_INSTANCE
