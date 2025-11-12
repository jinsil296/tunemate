import { API_BASE_URL } from './api-config';
import axios from 'axios';

const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 1000,
    headers: { 'Authorization': 'Bearer token' }
});
// 최초 로그인시에는 token 없이 보내는 거 수용
export default instance;
