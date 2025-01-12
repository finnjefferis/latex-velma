"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

type Playlist = {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  tracks: { total: number; items: TrackItem[] };
};

type TrackItem = {
  track: {
    id: string;
    name: string;
    artists: { name: string }[];
    album: { images: { url: string }[] };
  };
};

type SpotifyUser = {
  id: string;
  profilePicture: string | null;
};

type Vote = {
  spotifyTrackId: string;
  spotifyUserId: string;
  profilePicture: string | null;
};

export default function PlaylistsClient({ user, token }: { user: SpotifyUser; token: string }) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]); // Track votes for songs

  useEffect(() => {
    async function fetchPlaylists() {
      if (!token) {
        setError("No access token available for fetching playlists.");
        setIsLoading(false);
        return;
      }

      try {
        const playlistIds = ["4wOKl0V3Hy5QnNUmYxM6Tk", "2QgT7vxgcZNLpiIPhuJDo0"]; // First is "Latex Velma", second is "Suggestions"
        const playlists = await Promise.all(
          playlistIds.map(async (id) => {
            const res = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
              const errorText = await res.text();
              console.error(`Failed to fetch playlist ${id}: ${errorText}`);
              throw new Error(`Failed to fetch playlist ${id}`);
            }
            return res.json();
          })
        );
        setPlaylists(playlists);
        setError(null); // Clear any previous errors
      } catch (err) {
        console.error("Error fetching playlists:", err);
        setError("Failed to fetch playlists. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlaylists();
  }, [token]);

  // Handle vote toggling
  const handleVote = async (trackId: string) => {
    const isInSuggestions = playlists[1]?.tracks.items.some((item) => item.track.id === trackId);

    if (!isInSuggestions) {
      alert("You can only vote for songs in the Suggestions playlist!");
      return;
    }

    // Check if already voted
    const existingVote = votes.find((vote) => vote.spotifyTrackId === trackId);

    if (existingVote) {
      // Remove vote
      setVotes((prevVotes) => prevVotes.filter((vote) => vote.spotifyTrackId !== trackId));
    } else {
      // Add vote
      setVotes((prevVotes) => [
        ...prevVotes,
        { spotifyTrackId: trackId, spotifyUserId: user.id, profilePicture: user.profilePicture },
      ]);
    }
  };

  const generatePlaceholder = (username: string) => {
    const colors = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500"];
    const randomColor = colors[Math.floor(username.charCodeAt(0) % colors.length)];
    const firstLetter = username[0].toUpperCase();

    return (
      <div
        className={`flex items-center justify-center w-8 h-8 rounded-full ${randomColor} text-white text-xs font-bold`}
      >
        {firstLetter}
      </div>
    );
  };

  const getProfilePicture = (profilePicture: string | null, username: string) => {
    return profilePicture ? (
      <Image
        src={profilePicture}
        alt="Profile Picture"
        width={32}
        height={32}
        className="rounded-full"
      />
    ) : (
      generatePlaceholder(username)
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <p>Loading playlists...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="mb-8 flex flex-col items-center">
        {getProfilePicture(user.profilePicture, user.id)}
        <h1 className="text-2xl font-bold mt-4">Welcome, {user.id}</h1>
      </div>

      {playlists.map((playlist, index) => (
        <div key={playlist.id} className="mb-8 w-full max-w-3xl">
          <div className="flex flex-col items-center gap-4 mb-6">
            <Image
              src={playlist.images[0]?.url}
              alt={`${playlist.name} cover`}
              width={192}
              height={192}
              className="rounded-md shadow-md"
            />
            <h2 className="text-xl font-semibold">{playlist.name}</h2>
            <p className="text-sm text-gray-400">{playlist.description || "No description available."}</p>
            <p className="text-sm text-gray-400">Total Tracks: {playlist.tracks.total}</p>
          </div>

          <ul className="text-left w-full">
            {playlist.tracks.items.map((item) => {
              const hasVoted = votes.some((vote) => vote.spotifyTrackId === item.track.id);

              return (
                <li
                  key={item.track.id}
                  className={`flex items-center gap-4 p-2 border-b border-gray-700 last:border-b-0 cursor-pointer ${
                    hasVoted ? "bg-green-700" : "hover:bg-gray-700"
                  }`}
                  onClick={() => (index === 1 ? handleVote(item.track.id) : null)}
                >
                  <Image
                    src={item.track.album.images[0]?.url || ""}
                    alt={`${item.track.name} cover`}
                    width={48}
                    height={48}
                    className="rounded"
                  />
                  <div>
                    <p className="font-medium">{item.track.name}</p>
                    <p className="text-sm text-gray-400">
                      {item.track.artists.map((artist) => artist.name).join(", ")}
                    </p>
                  </div>
                  {hasVoted && (
                    <div className="ml-auto flex items-center gap-2">
                      {getProfilePicture(user.profilePicture, user.id)}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
