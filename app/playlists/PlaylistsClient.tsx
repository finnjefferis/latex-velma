"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import SongSuggestions from "./SongSuggestions"; 

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
  spotifytrackid: string;
  spotifyuserid: string;
};

export default function PlaylistsClient() {
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const param = searchParams.get("accessToken");

    if (!param) {
      router.push("/api/auth");
      return;
    }

    setToken(param);

    const fetchData = async () => {
      try {
        const userRes = await fetch("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${param}` },
        });
        if (!userRes.ok) throw new Error(`Failed to fetch Spotify user. Status: ${userRes.status}`);
        const userData = await userRes.json();
        setUser({ id: userData.id, profilePicture: userData.images?.[0]?.url ?? null });

        const playlistIds = ["4wOKl0V3Hy5QnNUmYxM6Tk", "2QgT7vxgcZNLpiIPhuJDo0"];
        const fetchedPlaylists = await Promise.all(
          playlistIds.map(async (id) => {
            const res = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
              headers: { Authorization: `Bearer ${param}` },
            });
            if (!res.ok) throw new Error(`Failed to fetch playlist ${id}`);
            return res.json();
          })
        );
        setPlaylists(fetchedPlaylists);

        const { data, error } = await supabase.from("votes").select("*");
        if (error) throw error;
        setVotes(data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [searchParams, router]);

  const handleVote = async (trackId: string) => {
    if (!user) {
      console.error("No user available for voting.");
      return;
    }

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

    const existingVote = votes.find((vote) => vote.spotifytrackid === trackId);

    try {
      if (existingVote) {
        const { error } = await supabase
          .from("votes")
          .delete()
          .match({ spotifyuserid: user.id, spotifytrackid: trackId });
        if (error) throw error;

        setVotes((prev) => prev.filter((vote) => vote.spotifytrackid !== trackId));
      } else {
        const { error } = await supabase.from("votes").insert([
          {
            spotifytrackid: trackId,
            spotifyuserid: user.id,
            votedat: new Date().toISOString(),
          },
        ]);
        if (error) throw error;

        setVotes((prev) => [
          ...prev,
          { spotifytrackid: trackId, spotifyuserid: user.id },
        ]);
      }
    } catch (err) {
      console.error("Error managing vote:", err);
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
        {user?.profilePicture ? (
          <Image
            src={user.profilePicture}
            alt="Profile Picture"
            width={96}
            height={96}
            className="rounded-full"
          />
        ) : (
          generatePlaceholder(user?.id || "Unknown")
        )}
        <h1 className="text-2xl font-bold mt-4">Welcome, {user?.id}</h1>
      </div>

      {playlists.map((playlist, index) => (
        <div key={playlist.id} className="mb-8 w-full max-w-3xl">
          <div className="flex flex-col items-center gap-4 mb-6">
            {playlist.images[0]?.url ? (
              <Image
                src={playlist.images[0].url}
                alt={`${playlist.name} cover`}
                width={192}
                height={192}
                className="rounded-md shadow-md"
              />
            ) : null}
            <h2 className="text-xl font-semibold">{playlist.name}</h2>
            <p className="text-sm text-gray-400">{playlist.description || "No description available."}</p>
          </div>

          <ul className="text-left w-full">
            {playlist.tracks.items.map((item) => {
              const trackVotes = votes.filter((vote) => vote.spotifytrackid === item.track.id);

              return (
                <li
                  key={item.track.id}
                  className={`flex items-center gap-4 p-2 border-b border-gray-700 last:border-b-0 ${
                    index === 1 ? "cursor-pointer" : ""
                  } ${trackVotes.length > 0 ? "bg-green-700" : "hover:bg-gray-700"}`}
                  onClick={() => (index === 1 ? handleVote(item.track.id) : null)}
                >
                  {item.track.album.images[0]?.url ? (
                    <Image
                      src={item.track.album.images[0].url}
                      alt={`${item.track.name} cover`}
                      width={48}
                      height={48}
                      className="rounded"
                    />
                  ) : null}
                  <div>
                    <p className="font-medium">{item.track.name}</p>
                    <p className="text-sm text-gray-400">
                      {item.track.artists.map((artist) => artist.name).join(", ")}
                    </p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
  {trackVotes.map((vote, index) =>
    vote.spotifyuserid === user?.id ? (
      user.profilePicture ? (
        <Image
          key={`${vote.spotifyuserid}-${index}`} // Use a unique combination as key
          src={user.profilePicture}
          alt="User PFP"
          width={24}
          height={24}
          className="rounded-full"
        />
      ) : (
        <div
          key={`${vote.spotifyuserid}-${index}`} // Use the same unique combination for placeholders
          className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 text-white text-xs font-bold"
        >
          {vote.spotifyuserid[0]?.toUpperCase()}
        </div>
      )
    ) : (
      <div
        key={`${vote.spotifyuserid}-${index}`} // Ensure unique keys for all elements
        className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-700 text-white text-xs font-bold"
      >
        {vote.spotifyuserid[0]?.toUpperCase()}
      </div>
    )
  )}
</div>

                </li>
              );
            })}
          </ul>
        </div>
      ))}
{token && user?.id && (
  <div className="mt-12 w-full max-w-3xl">
    <h2 className="text-xl font-semibold text-center mb-4">Suggest a Song</h2>
    <SongSuggestions token={token!} userId={user?.id || ""} playlistId="2QgT7vxgcZNLpiIPhuJDo0" />

  </div>
)}

    </div>
  );
}
