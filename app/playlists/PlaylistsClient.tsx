"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";
import SongSuggestions from "./SongSuggestions";
import Votes from "./Votes";

const MAIN_PLAYLIST_ID = "4wOKl0V3Hy5QnNUmYxM6Tk";
const SUGGESTIONS_PLAYLIST_ID = "2QgT7vxgcZNLpiIPhuJDo0";


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
        // 1. Get Spotify user
        const userRes = await fetch("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${param}` },
        });
        if (!userRes.ok) throw new Error(`Failed to fetch Spotify user. Status: ${userRes.status}`);
        const userData = await userRes.json();
        setUser({ id: userData.id, profilePicture: userData.images?.[0]?.url ?? null });

        // 2. Fetch playlists
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

        // 3. Fetch votes from Supabase
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
        // Remove vote
        const { error } = await supabase
          .from("votes")
          .delete()
          .match({ spotifyuserid: user.id, spotifytrackid: trackId });
        if (error) throw error;
        setVotes((prev) => prev.filter((v) => v.spotifytrackid !== trackId));
      } else {
        // Add vote
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

      // Then, inside handleVote (AFTER you've updated the local "votes" state) add:
const newVoteCount = votes.filter((v) => v.spotifytrackid === trackId).length;
// If we just inserted a vote, add +1:
const finalVoteCount = existingVote ? newVoteCount : newVoteCount + 1;

if (finalVoteCount === 5) {
  try {
    // 1. Remove track from SUGGESTIONS_PLAYLIST_ID
    await fetch(`https://api.spotify.com/v1/playlists/${SUGGESTIONS_PLAYLIST_ID}/tracks`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // or whatever your access token variable is
      },
      body: JSON.stringify({
        tracks: [{ uri: `spotify:track:${trackId}` }],
      }),
    });

    // 2. Add track to MAIN_PLAYLIST_ID
    await fetch(`https://api.spotify.com/v1/playlists/${MAIN_PLAYLIST_ID}/tracks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        uris: [`spotify:track:${trackId}`],
      }),
    });

    console.log(`Track ${trackId} moved from suggestions to main playlist!`);
  } catch (err) {
    console.error("Error moving track:", err);
  }
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

  // Helper to compute how "green" the background is (max of 5 votes displayed).
  function getVotePercentage(trackId: string) {
    const voteCount = votes.filter((v) => v.spotifytrackid === trackId).length;
    const fraction = Math.min(voteCount, 5);   // cap at 5
    return (fraction / 5) * 100;              // each vote is 20%
  }

  return (
    <div className="min-h-screen w-screen bg-gray-900 text-white">
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
                {playlist.tracks.items.map((item) => {
                  const bgWidth = getVotePercentage(item.track.id);

                  return (
                    <div
                      key={item.track.id}
                      className="mb-4 flex items-start gap-4 relative cursor-pointer"
                      // Only allow voting on the second playlist (index === 1)
                      onClick={() => index === 1 && handleVote(item.track.id)}
                    >
                      {/* Green background overlay */}
                      <div
  className="absolute top-0 left-0 h-full bg-green-500 opacity-25 
             transition-[width] duration-300 ease-in-out"
  style={{ width: `${bgWidth}%` }}
></div>


                      {/* Track Album Cover */}
                      {item.track.album.images[0]?.url ? (
                        <Image
                          src={item.track.album.images[0].url || ""}
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

                      {/* Track Info */}
                      <div className="flex-1 relative z-10">
                        <p
                          className={`font-medium ${
                            votes.some((v) => v.spotifytrackid === item.track.id) && index === 1
                              ? "text-green-400"
                              : ""
                          }`}
                        >
                          {item.track.name}
                        </p>
                        <p className="text-sm text-gray-400">
                          {item.track.artists.map((artist) => artist.name).join(", ")}
                        </p>
                      </div>

                      {/* Vote Count (or any other UI) */}
                      <div className="relative z-10">
                        <Votes votes={votes} trackId={item.track.id} />
                      </div>
                    </div>
                  );
                })}
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
              {playlist.tracks.items.map((item) => {
                const bgWidth = getVotePercentage(item.track.id);

                return (
                  <div
                    key={item.track.id}
                    className="mb-4 flex items-start gap-4 relative cursor-pointer"
                    onClick={() => index === 1 && handleVote(item.track.id)}
                  >
                    {/* Green background overlay */}
                    <div
  className="absolute top-0 left-0 h-full bg-green-500 opacity-25 
             transition-[width] duration-300 ease-in-out"
  style={{ width: `${bgWidth}%` }}
></div>


                    {/* Track Album Cover */}
                    {item.track.album.images[0]?.url ? (
                      <Image
                        src={item.track.album.images[0].url || ""}
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

                    {/* Track Info */}
                    <div className="flex-1 relative z-10">
                      <p
                        className={`font-medium ${
                          votes.some((v) => v.spotifytrackid === item.track.id) && index === 1
                            ? "text-green-400"
                            : ""
                        }`}
                      >
                        {item.track.name}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {item.track.artists.map((artist) => artist.name).join(", ")}
                      </p>
                    </div>

                    {/* Vote Count (or any other UI) */}
                    <div className="relative z-10">
                      <Votes votes={votes} trackId={item.track.id} />
                    </div>
                  </div>
                );
              })}
              {index === 1 && token && user?.id && (
                <div className="mt-6">
                  <SongSuggestions token={token} userId={user.id} playlistId={playlist.id} />
                </div>
              )}
            </div>
          ))}

          {/* Mobile Tabs */}
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
