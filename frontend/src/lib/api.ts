import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
})

api.interceptors.request.use((config) => {
  if (localStorage.getItem('chaos-mode') === 'true') {
    config.headers = config.headers ?? {}
    config.headers['x-chaos-token'] = 'true'
  }
  return config
})

export default api
