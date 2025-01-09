import Hero from "@/components/hero";
import { createClient } from "@/utils/supabase/server";
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
      <Hero />
      <main className="flex-1 flex flex-col gap-6 px-4">


        {/* Spotify Login */}
        <section>
          <h3 className="font-medium text-lg mb-2">Spotify Integration</h3>
          <Link href={spotifyAuthUrl}>
            <button className="px-4 py-2 bg-green-500 text-white rounded">Log in with Spotify</button>
          </Link>
        </section>

     
      </main>
    </>
  );
}
