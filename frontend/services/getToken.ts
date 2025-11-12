import { Platform } from 'react-native';
import Cookies from 'js-cookie';

export type Token = {
  accessToken?: string;
  refreshToken?: string;
}

export const getToken22222 = async (): Promise<Token> => {
  try {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const CookieManager = require('@react-native-cookies/cookies');
      
        // getAll을 사용하여 쿠키 가져오기
        const cookies = await CookieManager.getAll();
        console.log('Cookies:', cookies);
  
        return {
          accessToken: cookies['access_token']?.value || '',
          refreshToken: cookies['refresh_token']?.value || ''
        };
    } else {
      // 웹에서는 js-cookie 사용
      const accessToken = Cookies.get('access_token') || '';
      const refreshToken = Cookies.get('refresh_token') || '';
      return {
        accessToken,
        refreshToken
      };
    }
  } catch (error) {
    console.log('Error fetching tokens from cookies:', error);
    return { accessToken: '', refreshToken: '' };
  }
};
