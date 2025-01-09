"use client";

import { useEffect, useState } from "react";


export default function HomePage() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Replace these with your playlist IDs
  const playlistIds = ["4wOKl0V3Hy5QnNUmYxM6Tk", "2QgT7vxgcZNLpiIPhuJDo0"];
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
  const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!;
  const scopes = ["playlist-read-private", "playlist-read-collaborative"];

  const authUrl = `https://accounts.spotify.com/authorize?response_type=token&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join(
    " "
  )}`;

  useEffect(() => {
    const hash = window.location.hash;
    const token = new URLSearchParams(hash.substring(1)).get("access_token");

    if (!token) {
      window.location.href = authUrl; // Redirect to Spotify login if no token
      return;
    }

    const fetchPlaylists = async () => {
      try {
        const fetchedPlaylists = await Promise.all(
          playlistIds.map(async (id) => {
            const response = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (!response.ok) {
              throw new Error(`Error fetching playlist ${id}: ${response.statusText}`);
            }

            return await response.json();
          })
        );

        setPlaylists(fetchedPlaylists);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    fetchPlaylists();
  }, []);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
      <h1 className="text-2xl font-bold mb-6">My Playlists</h1>

      {playlists.map((playlist) => (
        <div key={playlist.id} className="mb-8">
          {/* Playlist Header */}
          <div className="flex flex-col items-center gap-2 mb-4">
            <img
              src={playlist.images[0]?.url}
              alt={`${playlist.name} cover`}
              className="w-48 h-48 rounded-md shadow-md"
            />
            <h2 className="text-xl font-semibold">{playlist.name}</h2>
            <p className="text-sm text-gray-400">{playlist.description || "No description available."}</p>
            <p className="text-sm text-gray-400">Total Tracks: {playlist.tracks.total}</p>
          </div>

          {/* Playlist Tracks */}
          <ul className="w-full max-w-md">
            {playlist.tracks.items.map((item: any) => {
              const track = item.track;
              return (
                <li
                  key={track.id}
                  className="flex items-center gap-4 p-2 border-b border-gray-700 last:border-b-0"
                >
                  <img
                    src={track.album.images[0]?.url}
                    alt={track.name}
                    className="w-12 h-12 rounded"
                  />
                  <div>
                    <p className="font-medium">{track.name}</p>
                    <p className="text-sm text-gray-400">
                      {track.artists.map((artist: any) => artist.name).join(", ")}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
