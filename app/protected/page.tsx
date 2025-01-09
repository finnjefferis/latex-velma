import Hero from "@/components/hero";
import { createClient } from "@/utils/supabase/server";

import { FaSpotify } from "react-icons/fa";
import Link from "next/link";

export default async function Home() {
  const supabase = createClient();

  // Fetch data from Supabase tables
  const [songsResult, votesResult, learnedSongsResult] = await Promise.all([
    (await supabase).from("Songs").select(),
    (await supabase).from("Votes").select(),
    (await supabase).from("LearnedSongs").select(),
  ]);

  const songs = songsResult.data || [];
  const votes = votesResult.data || [];
  const learnedSongs = learnedSongsResult.data || [];

  // Construct Spotify authorization URL
  const spotifyClientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
  const spotifyRedirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!;
  const spotifyScopes = ["playlist-read-private", "playlist-read-collaborative"];
  const spotifyAuthUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${encodeURIComponent(
    process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!
  )}&scope=${encodeURIComponent(
    "playlist-read-private playlist-read-collaborative"
  )}&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!)}`;
  

 
  
  
  return (
    <>
      <main className="flex-1 flex flex-col items-center justify-center px-4">
      
        <section className="text-center">
         
          <Link
            href={spotifyAuthUrl}
            className="flex items-center justify-center gap-3 px-6 py-4 bg-green-500 text-white rounded-full text-lg font-medium shadow-md hover:bg-green-600 transition duration-300"
          >
            <FaSpotify className="text-2xl" />
            Log in with Spotify
          </Link>
        </section>
      </main>
    </>
  );
  }
  

