import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_BASE_URL } from '@/services/api-config';
import { AuthTokens } from '@/types/spotify';
import { router } from 'expo-router';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const EXPIRES_IN_KEY = 'expires_in';
const SPOTIFY_ID = 'spotify_id';
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

export async function getSpotifyId() {
  return await SecureStore.getItemAsync(SPOTIFY_ID);
}

export async function getAccessToken() {
  const expiresAt = await SecureStore.getItemAsync(EXPIRES_IN_KEY);
  if (expiresAt && Date.now() >= parseInt(expiresAt)) {
    // 토큰이 만료된 경우
    console.log('토큰이 만료되어 리프레시 토큰으로 재발급 받습니다.');
    await refreshAccessToken();
  }
  return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function saveTokens({ access_token, refresh_token, spotify_id }: AuthTokens) {
  // 값이 있는지 확인
  if (!access_token || !refresh_token) {
    console.error('saveTokens: 유효한 access_token 또는 refresh_token이 없습니다.');
    return;
  }

  const expiresIn = (Date.now() + 3600 * 1000).toString();

  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access_token.toString());
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh_token.toString());
    await SecureStore.setItemAsync(EXPIRES_IN_KEY, expiresIn);
    await SecureStore.setItemAsync(SPOTIFY_ID, spotify_id.toString());

    console.log('토큰 및 만료 시간이 저장되었습니다 :: ', expiresIn);

    // 만료 시간을 숫자로 변환하여 scheduleTokenRefresh 호출
    scheduleTokenRefresh(parseInt(expiresIn, 10));
  } catch (error) {
    console.error('토큰 저장 중 오류 발생:', error);
  }
}

export async function refreshAccessToken() {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  const spotifyId = await SecureStore.getItemAsync(SPOTIFY_ID);
  if (!refreshToken) throw new Error('No refresh token available');
  console.log(refreshToken)
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken: refreshToken, spotifyId: spotifyId });
    const { access_token, refresh_token } = response.data;

    // 조건부로 각 값을 업데이트합니다
    if (access_token) await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access_token);
    if (refresh_token) await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh_token.toString());
    await SecureStore.setItemAsync(EXPIRES_IN_KEY, (Date.now() + 3600 * 1000).toString());
    
    return access_token;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('tokenService.ts - Refresh token request failed:', error.response?.status, error.response?.data);
      router.replace('/login');
    } else {
      console.error('Unexpected error during token refresh:', error);
    }
    throw error; // 필요 시 상위에서 처리할 수 있도록 오류를 다시 던집니다.
  }
}

function scheduleTokenRefresh(expiresIn: number) {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }

  // 리프레시 시간 설정 (만료 시간의 90%로 갱신)
  const refreshTime = expiresIn * 1000 * 0.9;
  refreshTimer = setTimeout(async () => {
    try {
      await refreshAccessToken();
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
    }
  }, refreshTime);
}

export async function getValidAccessToken() {
  const accessToken = await getAccessToken();
  
  if (!accessToken) {
    throw new Error('No access token available');
  }

  return accessToken;
}

export async function clearTokens() {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(EXPIRES_IN_KEY);
  } catch (error) {
    console.error('Error clearing tokens:', error);
    throw error;
  }
}