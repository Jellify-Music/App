import axios from 'axios'

/**
 * The Axios instance for making HTTP requests.
 *
 * Default timeout is set to 15 seconds.
 */
const AXIOS_INSTANCE = axios.create({
	timeout: 15 * 1000, // 15 seconds
})

export default AXIOS_INSTANCE
