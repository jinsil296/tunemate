import axios from 'axios';

const playTrack = async (deviceId: string, accessToken: string, trackUri: string) => {
  const url = `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`;
  const config = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    }
  };
  const data = {
    uris: [trackUri]
  };

  try {
    await axios.put(url, data, config);
  } catch (error) {
    console.log('Error playing track:', error);
  }
};

const pauseTrack = async (deviceId: string, accessToken: string) => {
  const url = `https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`;
  const config = {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    }
  };

  try {
    await axios.put(url, {}, config);
  } catch (error) {
    console.log('Error pausing track:', error);
  }
};

export { playTrack, pauseTrack };
