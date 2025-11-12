import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  loadLikedSongsFromDB,
  addLikedSong,
  removeLikedSong,
} from "@/services/likeTrackService";
import { SpotifyTrack } from "@/types/spotify";

interface LikedTracksContextType {
  likedSongs: SpotifyTrack[];
  addSongToLikes: (track: SpotifyTrack) => Promise<void>;
  removeSongFromLikes: (track: SpotifyTrack) => Promise<void>;
  isLiked: (trackId: string) => boolean;
}

interface LikedTracksProviderProps {
  children: ReactNode;
}

const LikedTracksContext = createContext<LikedTracksContextType | undefined>(
  undefined
);

export const LikedTracksProvider: React.FC<LikedTracksProviderProps> = ({
  children,
}) => {
  const [likedSongs, setLikedSongs] = useState<SpotifyTrack[]>([]);

  // 서버에서 좋아요 목록 로드
  useEffect(() => {
    const loadSongs = async () => {
      const dbSongs = await loadLikedSongsFromDB(); // 서버에서 최신 데이터 로드
      setLikedSongs(dbSongs);
    };
    loadSongs();
  }, []);

  // 좋아요 추가 함수
  const addSongToLikes = async (track: SpotifyTrack) => {
    await addLikedSong(track); // 서버에 저장
    setLikedSongs((prev) => [...prev, track]);
  };

  // 좋아요 제거 함수
  const removeSongFromLikes = async (track: SpotifyTrack) => {
    await removeLikedSong(track); // 서버에서 제거
    setLikedSongs((prev) => prev.filter((song) => song.id !== track.id));
  };

  // 특정 트랙이 좋아요 목록에 있는지 확인하는 함수
  const isLiked = (trackId: string) => {
    return likedSongs.some((song) => song.id === trackId);
  };

  return (
    <LikedTracksContext.Provider
      value={{ likedSongs, addSongToLikes, removeSongFromLikes, isLiked }}
    >
      {children}
    </LikedTracksContext.Provider>
  );
};

// 컨텍스트를 사용하기 위한 커스텀 훅
export const useLikedSongs = () => {
  const context = useContext(LikedTracksContext);
  if (!context) {
    throw new Error("useLikedSongs must be used within a LikedTracksProvider");
  }
  return context;
};
