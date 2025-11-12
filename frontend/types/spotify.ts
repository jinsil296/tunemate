// src/types/spotify.d.ts
// 메인
export interface SpotifyPlaylist {
    id: string;
    name: string;
    description: string;
    images: { url: string; height: number | null; width: number | null }[];
    owner: { 
        display_name: string | null; 
        id: string; 
        external_urls: { spotify: string }; 
    };
    public: boolean | null;
    snapshot_id: string;
    tracks: {
        href: string;
        total: number;
    };
    type: string;
    uri: string;
}

export type PlaylistsResponse = {
    href: string;
    items: SpotifyPlaylist[];
    limit: number;
    next: string | null;
    offset: number;
    previous: string | null;
    total: number;
};

export type AuthTokens = {
    access_token: string;
    refresh_token: string;
    spotify_id: string;
};

// 검색
export interface SpotifyImage {
    url: string;
    height?: number;
    width?: number;
}
  
export interface SpotifyArtist {
    id: string;
    name: string;
    genres: [];
}

export interface SpotifyAlbum {
    id: string;
    name: string;
    images: SpotifyImage[];
}

export interface SpotifyTrack {
    id: string;
    name: string;
    uri: string;
    preview_url: string;
    duration_ms: number;
    artists: SpotifyArtist[];
    album: SpotifyAlbum;
    deleteId?: number; // 삭제 상태를 관리하기 위한 옵션 속성
}

export interface Playlist {
    id: number;
    userId: string;
    title: string;
    thumbnailUrl: string;
    createDt: string;
    totalTracks: number;
}

export interface PlaylistTrack {
    id: number;
    playlistId: string;
    trackId: string;
    title: string;
    artistIds: string;
    artistNames: string;
    previewUrl: string;
    albumImageUrl: string;
    durationMs: number;
}

// 플레이리스트 트랙을 스포티파이 트랙으로
export function convertToSpotifyTrack2(track: PlaylistTrack): SpotifyTrack {
    return {
        id: track.trackId,
        name: track.title,
        uri: `spotify:track:${track.trackId}`,
        preview_url: track.previewUrl,
        duration_ms: track.durationMs,
        artists: track.artistIds.split(',').map((id, index) => ({
            id: id.trim(),
            name: track.artistNames.split(',')[index]?.trim() || "",
            genres: [], // Optional: Adjust if genre data is available
        })),
        album: {
            id: track.trackId,
            name: track.title,
            images: [{ url: track.albumImageUrl, height: undefined, width: undefined }],
        },
        deleteId: track.id,
    };
}

export function convertplaylistTracksArray(tracks: PlaylistTrack[]): SpotifyTrack[] {
    return tracks.map(convertToSpotifyTrack2);
}

// 이력 상세 불러오는 type
export interface SpotifyTrack2 {
    id: number;
    recommendationId: string;
    trackId: string;
    title: string;
    artistIds: string;
    artistNames: string;
    previewUrl: string;
    albumImageUrl: string;
    durationMs: number;
}

export interface SpotifySearchResponse {
    tracks: {
        items: SpotifyTrack[];
        limit: number;
        offset: number;
        total: number;
    };
    artists: {
        items: SpotifyArtist[];
    }
}

export interface RecommendationReq {
    recommendationId: string;
    userId: string;
    uniqueId: string;
    title: string;
    recommendationType: string;
    trackIds: string;
    artistIds: string;
    artistNames: string;
    artistGenres: string;
    albumImageUrl: string;
    createDt: string;
}
// 이력 트랙을 스포티파이 트랙으로
export function convertToSpotifyTrack(track: SpotifyTrack2): SpotifyTrack {
    return {
        id: track.trackId,
        name: track.title,
        uri: `spotify:track:${track.trackId}`,
        preview_url: track.previewUrl,
        duration_ms: track.durationMs,
        artists: track.artistIds.split(',').map((id, index) => ({
            id: id.trim(),
            name: track.artistNames.split(',')[index]?.trim() || "",
            genres: [], // Optional: Adjust if genre data is available
        })),
        album: {
            id: track.recommendationId,
            name: track.title,
            images: [{ url: track.albumImageUrl, height: undefined, width: undefined }],
        },
        deleteId: track.id,
    };
}

export function convertSpotifyTrack2Array(tracks: SpotifyTrack2[]): SpotifyTrack[] {
    return tracks.map(convertToSpotifyTrack);
}

export const seed_genres = ["acoustic", "afrobeat", "alt-rock", "alternative", "ambient",
    "anime", "black-metal", "bluegrass", "blues", "bossanova",
    "brazil", "breakbeat", "british", "cantopop", "chicago-house",
    "children", "chill", "classical", "club", "comedy",
    "country", "dance", "dancehall", "death-metal", "deep-house",
    "detroit-techno", "disco", "disney", "drum-and-bass", "dub",
    "dubstep", "edm", "electro", "electronic", "emo",
    "folk", "forro", "french", "funk", "garage",
    "german", "gospel", "goth", "grindcore", "groove",
    "grunge", "guitar", "happy", "hard-rock", "hardcore",
    "hardstyle", "heavy-metal", "hip-hop", "holidays", "honky-tonk",
    "house", "idm", "indian", "indie", "indie-pop",
    "industrial", "iranian", "j-dance", "j-idol", "j-pop",
    "j-rock", "jazz", "k-pop", "kids", "latin",
    "latino", "malay", "mandopop", "metal", "metal-misc",
    "metalcore", "minimal-techno", "movies", "mpb", "new-age",
    "new-release", "opera", "pagode", "party", "philippines-opm",
    "piano", "pop", "pop-film", "post-dubstep", "power-pop",
    "progressive-house", "psych-rock", "punk", "punk-rock", "r-n-b",
    "rainy-day", "reggae", "reggaeton", "road-trip", "rock",
    "rock-n-roll", "rockabilly", "romance", "sad", "salsa",
    "samba", "sertanejo", "show-tunes", "singer-songwriter", "ska",
    "sleep", "songwriter", "soul", "soundtracks", "spanish",
    "study", "summer", "swedish", "synth-pop", "tango",
    "techno", "trance", "trip-hop", "turkish", "work-out", "world-music"];