import axios from 'axios'

/**
 * The Axios instance for making HTTP requests.
 *
 * Default timeout is set to 60 seconds.
 */
const AXIOS_INSTANCE = axios.create({
	timeout: 60000,
})

export default AXIOS_INSTANCE
