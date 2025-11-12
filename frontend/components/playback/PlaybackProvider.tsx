import React, { createContext, useContext, useState, useEffect } from 'react';
import { Audio } from 'expo-av';
import { SpotifyTrack } from '@/types/spotify';

interface PlaybackContextType {
  currentTrack: SpotifyTrack | null;
  isPlaying: boolean;
  currentPosition: number;
  duration: number;
  playTrack: (track: SpotifyTrack) => void;
  playTrackList: (tracks: SpotifyTrack[]) => void;
  togglePlayPause: () => void;
  isFullScreen: boolean;
  setIsFullScreen: (value: boolean) => void;
  sound: Audio.Sound | null;
  clearPlayback: () => void;
  playbackQueue: SpotifyTrack[];
  setPlaybackQueue: (tracks: SpotifyTrack[]) => void;
  playNextTrack: () => void;
  playPreviousTrack: () => void;
  seekToPosition: (position: number) => void;
}

const PlaybackContext = createContext<PlaybackContextType | undefined>(undefined);

export const PlaybackProvider = ({ children }: { children: React.ReactNode }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackQueue, setPlaybackQueue] = useState<SpotifyTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync(); // 컴포넌트가 언마운트되면 사운드 정리
        }
      : undefined;
  }, [sound]);

  useEffect(() => {
    const enableSilentModePlayback = async () => {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        interruptionModeIOS: 1,
        shouldDuckAndroid: true,
      });
    };
  
    enableSilentModePlayback();
  }, []);
  
  const playTrack = async (track: SpotifyTrack) => {
    if (sound) {
      await sound.unloadAsync();
    }

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: track.preview_url },
      { shouldPlay: true }
    );

    setSound(newSound);
    setCurrentTrack(track);
    setIsPlaying(true);

    newSound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded) {
        setCurrentPosition(status.positionMillis || 0);
        setDuration(status.durationMillis || 0);
        
        if (status.didJustFinish) {
          playNextTrack();
        }
      }
    });
  };

  const playTrackList = (tracks: SpotifyTrack[]) => {
    setPlaybackQueue(tracks);
    setCurrentTrackIndex(0);
    playTrack(tracks[0]); // 첫 번째 곡 재생
  };

  const playNextTrack = () => {
    if (currentTrackIndex < playbackQueue.length - 1) {
      const nextTrackIndex = currentTrackIndex + 1;
      setCurrentTrackIndex(nextTrackIndex);
      playTrack(playbackQueue[nextTrackIndex]);
    } else {
      clearPlayback(); // 마지막 곡이 재생 완료되면 재생 중지
    }
  };

  const playPreviousTrack = () => {
    if (currentTrackIndex > 0) {
      const previousTrackIndex = currentTrackIndex - 1;
      setCurrentTrackIndex(previousTrackIndex);
      playTrack(playbackQueue[previousTrackIndex]);
    }
  };

  const togglePlayPause = async () => {
    if (sound) {
      isPlaying ? await sound.pauseAsync() : await sound.playAsync();
      setIsPlaying(!isPlaying);
    }
  };

  const seekToPosition = async (position: number) => {
    if (sound) await sound.setPositionAsync(position);
  };

  const clearPlayback = () => {
    if (sound) {
      sound.unloadAsync();
      setSound(null);
    }
    setCurrentTrack(null);
    setIsPlaying(false);
  };

  return (
    <PlaybackContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentPosition,
        duration,
        playTrack,
        playTrackList,
        togglePlayPause,
        isFullScreen,
        setIsFullScreen,
        sound,
        clearPlayback,
        playbackQueue,
        setPlaybackQueue,
        playNextTrack,
        playPreviousTrack,
        seekToPosition,
      }}
    >
      {children}
    </PlaybackContext.Provider>
  );
};

export const usePlayback = () => {
  const context = useContext(PlaybackContext);
  if (!context) {
    throw new Error('usePlayback must be used within a PlaybackProvider');
  }
  return context;
};