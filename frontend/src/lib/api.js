import axios from 'axios'
import { ENV } from './env'

export const api = axios.create({
  baseURL: ENV.API_BASE_URL + '/api',
  withCredentials: false,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('gp_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

