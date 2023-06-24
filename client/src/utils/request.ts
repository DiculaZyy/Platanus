import axios from 'axios'

const userAgent = navigator.userAgent.toLowerCase();

const baseURL_dev = 'api/'
const baseURL_electron = 'http://localhost:4000/'

const service = axios.create({
    baseURL : (userAgent.indexOf(' electron/') > -1) ? baseURL_electron : baseURL_dev,
    timeout: 5000
})

export default service