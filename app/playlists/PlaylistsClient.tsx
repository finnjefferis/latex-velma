"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

export default function PlaylistsClient() {
  // ------------------
  // State
  // ------------------
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]); // Track votes for songs

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ------------------
  // Next.js Hooks
  // ------------------
  const searchParams = useSearchParams();
  const router = useRouter();

  // ------------------
  // Fetch Token, User, and Playlists
  // ------------------
  useEffect(() => {
    const param = searchParams.get("accessToken");

    if (!param) {
      // If no accessToken in query, redirect.
      router.push("/api/auth");
      return;
    }

    // Store the token in state
    setToken(param);

    // Define a function that fetches user + playlists
    const fetchData = async () => {
      try {
        // 1) Fetch Spotify user
        const userRes = await fetch("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${param}` },
        });
        if (!userRes.ok) {
          throw new Error(`Failed to fetch Spotify user. Status: ${userRes.status}`);
        }
        const userData = await userRes.json();
        const spotifyUser: SpotifyUser = {
          id: userData.id,
          profilePicture: userData.images?.[0]?.url ?? null,
        };
        setUser(spotifyUser);

        // 2) Fetch two specific playlists
        const playlistIds = ["4wOKl0V3Hy5QnNUmYxM6Tk", "2QgT7vxgcZNLpiIPhuJDo0"]; 
        const fetchedPlaylists = await Promise.all(
          playlistIds.map(async (id) => {
            const res = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
              headers: { Authorization: `Bearer ${param}` },
            });
            if (!res.ok) {
              const errorText = await res.text();
              console.error(`Failed to fetch playlist ${id}: ${errorText}`);
              throw new Error(`Failed to fetch playlist ${id}`);
            }
            return res.json();
          })
        );
        setPlaylists(fetchedPlaylists);
      } catch (err) {
        console.error("Error during fetch:", err);
        setError("Failed to fetch user or playlists. Please try again later.");
        // If something fails, optionally redirect or just show error
        // router.push("/api/auth");
      } finally {
        setIsLoading(false);
      }
    };

    // Actually fetch everything
    fetchData();
  }, [searchParams, router]);

  // ------------------
  // Voting Logic
  // ------------------
  const handleVote = (trackId: string) => {
    // Ensure we're operating on the second playlist (Suggestions)
    const suggestionsPlaylist = playlists[1];
    if (!suggestionsPlaylist) {
      alert("Suggestions playlist not found!");
      return;
    }

    const isInSuggestions = suggestionsPlaylist.tracks.items.some(
      (item) => item.track.id === trackId
    );
    if (!isInSuggestions) {
      alert("You can only vote for songs in the Suggestions playlist!");
      return;
    }

    // Check if user already voted for this track
    const existingVote = votes.find((vote) => vote.spotifyTrackId === trackId);

    if (!user) {
      // If we somehow have no user, can't vote
      console.error("No user available for voting.");
      return;
    }

    if (existingVote) {
      // Remove vote
      setVotes((prev) => prev.filter((vote) => vote.spotifyTrackId !== trackId));
    } else {
      // Add vote
      setVotes((prev) => [
        ...prev,
        {
          spotifyTrackId: trackId,
          spotifyUserId: user.id,
          profilePicture: user.profilePicture,
        },
      ]);
    }
  };

  // ------------------
  // Helper to generate placeholder
  // ------------------
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

  // ------------------
  // Helper to get or generate profile picture
  // ------------------
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

  // ------------------
  // Render
  // ------------------

  // 1) Loading Screen
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <p>Loading playlists...</p>
      </div>
    );
  }

  // 2) Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // 3) If we have no user or token after loading, treat as an error
  if (!user || !token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
        <p className="text-red-500">Something went wrong. No user or token found.</p>
      </div>
    );
  }

  // 4) Render Playlists
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      {/* User Info */}
      <div className="mb-8 flex flex-col items-center">
        {getProfilePicture(user.profilePicture, user.id)}
        <h1 className="text-2xl font-bold mt-4">Welcome, {user.id}</h1>
      </div>

      {/* Playlist Cards */}
      {playlists.map((playlist, index) => (
        <div key={playlist.id} className="mb-8 w-full max-w-3xl">
          <div className="flex flex-col items-center gap-4 mb-6">
            {playlist.images[0]?.url && (
              <Image
                src={playlist.images[0].url}
                alt={`${playlist.name} cover`}
                width={192}
                height={192}
                className="rounded-md shadow-md"
              />
            )}
            <h2 className="text-xl font-semibold">{playlist.name}</h2>
            <p className="text-sm text-gray-400">
              {playlist.description || "No description available."}
            </p>
            <p className="text-sm text-gray-400">Total Tracks: {playlist.tracks.total}</p>
          </div>

          <ul className="text-left w-full">
            {playlist.tracks.items.map((item) => {
              const hasVoted = votes.some((vote) => vote.spotifyTrackId === item.track.id);

              return (
                <li
                  key={item.track.id}
                  className={`flex items-center gap-4 p-2 border-b border-gray-700 last:border-b-0 ${
                    index === 1 ? "cursor-pointer" : ""
                  } ${hasVoted ? "bg-green-700" : "hover:bg-gray-700"}`}
                  onClick={() => (index === 1 ? handleVote(item.track.id) : null)}
                >
                  {item.track.album.images[0]?.url && (
                    <Image
                      src={item.track.album.images[0].url}
                      alt={`${item.track.name} cover`}
                      width={48}
                      height={48}
                      className="rounded"
                    />
                  )}
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
