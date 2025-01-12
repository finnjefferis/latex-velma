"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type SearchResult = {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { images: { url: string }[] };
};

type SongSuggestionsProps = {
  token: string;
  userId: string; // Spotify user ID for tracking votes
  playlistId: string; // Spotify playlist ID to which songs will be added
};

export default function SongSuggestions({ token, userId, playlistId }: SongSuggestionsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(searchQuery)}&type=track`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) throw new Error(`Failed to fetch search results: ${res.statusText}`);

      const data = await res.json();
      setSearchResults(data.tracks.items);
    } catch (err) {
      console.error("Error searching for songs:", err);
      setError("Failed to fetch search results. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVoteAndSong = async (track: SearchResult) => {
    if (!userId) {
      console.error("No user ID available for adding the vote.");
      alert("You must be signed in to suggest a song.");
      return;
    }

    try {
      // 1. Add a vote in Supabase
      const { error: voteError } = await supabase.from("votes").insert({
        spotifytrackid: track.id,
        spotifyuserid: userId,
        votedat: new Date().toISOString(),
      });

      if (voteError) {
        throw new Error(`Failed to add vote: ${voteError.message}`);
      }

      // 2. Add the song to the Spotify playlist
      const spotifyRes = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            uris: [`spotify:track:${track.id}`],
          }),
        }
      );

      if (!spotifyRes.ok) {
        const spotifyError = await spotifyRes.json();
        throw new Error(`Failed to add song to Spotify playlist: ${spotifyError.error.message}`);
      }

      alert(`Successfully added "${track.name}" to the playlist and voted!`);
    } catch (err) {
      console.error("Error adding vote or song to Spotify playlist:", err);
      alert("Failed to add the song or vote. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-3xl mt-8 bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold text-white mb-4">Suggest a Song</h2>

      {/* Search Bar */}
      <div className="flex items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search for a song..."
          className="flex-1 p-2 rounded-md bg-gray-700 text-white"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          onClick={handleSearch}
          disabled={isLoading}
        >
          {isLoading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Search Results */}
      <ul className="space-y-4">
        {searchResults.map((result) => (
          <li key={result.id} className="flex items-center gap-4 p-2 bg-gray-700 rounded-md">
            {result.album.images[0]?.url && (
              <Image
                src={result.album.images[0].url}
                alt={`${result.name} cover`}
                width={48}
                height={48}
                className="rounded-md"
              />
            )}
            <div className="flex-1">
              <p className="text-white font-medium">{result.name}</p>
              <p className="text-sm text-gray-400">
                {result.artists.map((artist) => artist.name).join(", ")}
              </p>
            </div>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={() => handleAddVoteAndSong(result)}
            >
              Vote & Add
            </button>
          </li>
        ))}
      </ul>

      {/* No Results Message */}
      {!isLoading && searchResults.length === 0 && searchQuery && (
        <p className="text-gray-400">No results found for "{searchQuery}".</p>
      )}
    </div>
  );
}
