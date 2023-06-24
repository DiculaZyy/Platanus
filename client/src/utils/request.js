import axios from 'axios'

const isProd = () => import.meta.env.VITE_APP_ENV === 'production'

const baseURL_dev = 'api/'
const baseURL_prod = 'http://localhost:4000/'

const service = axios.create({
    baseURL : isProd ? baseURL_prod : baseURL_dev,
    timeout: 5000
})

export default service
