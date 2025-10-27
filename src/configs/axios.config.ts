import axios from 'axios'

const AXIOS_INSTANCE = axios.create({
	timeout: 10000,
})

export default AXIOS_INSTANCE
