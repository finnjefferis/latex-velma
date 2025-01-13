"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import SongSuggestions from "./SongSuggestions";
import Votes from "./Votes";

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
  votedat: string; 
};

export default function PlaylistsClient() {
  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0); // Active tab for mobile view

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
        const votedAt = new Date().toISOString();
        const { error } = await supabase.from("votes").insert([
          {
            spotifytrackid: trackId,
            spotifyuserid: user.id,
            votedat: votedAt,
          },
        ]);
        if (error) throw error;

        setVotes((prev) => [
          ...prev,
          {
            spotifytrackid: trackId,
            spotifyuserid: user.id,
            votedat: votedAt,
          },
        ]);
      }
    } catch (err) {
      console.error("Error managing vote:", err);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto py-8">
        {/* Desktop View */}
        <div className="hidden md:grid grid-cols-2 gap-4">
          {playlists.map((playlist, index) => (
            <div key={playlist.id}>
              <h2 className="text-xl font-bold mb-4">{playlist.name}</h2>
              {playlist.images[0]?.url && (
                <Image
                  src={playlist.images[0].url}
                  alt={`${playlist.name} cover`}
                  width={192}
                  height={192}
                  className="rounded-md shadow-md"
                />
              )}
              <ul className="mt-4">
                {playlist.tracks.items.map((item) => (
                  <div
                    key={item.track.id}
                    className="mb-4 flex items-start gap-4"
                    onClick={() => index === 1 && handleVote(item.track.id)}
                  >
                    {item.track.album.images[0]?.url ? (
                      <Image
                        src={item.track.album.images[0]?.url || ""}
                        alt={`${item.track.name} cover`}
                        width={48}
                        height={48}
                        className="rounded-md"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-700 rounded-md flex items-center justify-center text-sm text-white">
                        N/A
                      </div>
                    )}
                    <div className="flex-1">
                      <p
                        className={`font-medium ${
                          votes.some((vote) => vote.spotifytrackid === item.track.id) && index === 1
                            ? "text-green-500"
                            : ""
                        }`}
                      >
                        {item.track.name}
                      </p>
                      <p className="text-sm text-gray-400">
                        {item.track.artists.map((artist) => artist.name).join(", ")}
                      </p>
                    </div>
                    <Votes votes={votes} trackId={item.track.id} />
                  </div>
                ))}
              </ul>
              {index === 1 && token && user?.id && (
                <div className="mt-6">
                  <SongSuggestions token={token} userId={user.id} playlistId={playlist.id} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile View */}
        <div className="md:hidden">
          {playlists.map((playlist, index) => (
            <div
              key={playlist.id}
              className={`${activeTab === index ? "block" : "hidden"} px-4 py-6`}
            >
              <h2 className="text-lg font-bold mb-4">{playlist.name}</h2>
              {playlist.tracks.items.map((item) => (
                <div
                  key={item.track.id}
                  className="mb-4 flex items-start gap-4"
                  onClick={() => index === 1 && handleVote(item.track.id)}
                >
                  {item.track.album.images[0]?.url ? (
                    <Image
                      src={item.track.album.images[0]?.url || ""}
                      alt={`${item.track.name} cover`}
                      width={48}
                      height={48}
                      className="rounded-md"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-700 rounded-md flex items-center justify-center text-sm text-white">
                      N/A
                    </div>
                  )}
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        votes.some((vote) => vote.spotifytrackid === item.track.id) && index === 1
                          ? "text-green-500"
                          : ""
                      }`}
                    >
                      {item.track.name}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {item.track.artists.map((artist) => artist.name).join(", ")}
                    </p>
                  </div>
                  <Votes votes={votes} trackId={item.track.id} />
                </div>
              ))}
              {index === 1 && token && user?.id && (
                <div className="mt-6">
                  <SongSuggestions token={token} userId={user.id} playlistId={playlist.id} />
                </div>
              )}
            </div>
          ))}
          <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 flex justify-around py-2">
            {playlists.map((playlist, index) => (
              <button
                key={playlist.id}
                onClick={() => setActiveTab(index)}
                className={`flex-1 text-center py-2 text-sm ${
                  activeTab === index ? "text-white" : "text-gray-400"
                }`}
              >
                {playlist.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
