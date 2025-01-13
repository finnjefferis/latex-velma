import Hero from "@/components/hero";
import { createClient } from "@/utils/supabase/server";

import { FaSpotify } from "react-icons/fa";
import Link from "next/link";

export default async function Home() {
  const supabase = createClient();


  const spotifyAuthUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${encodeURIComponent(
    process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!
  )}&scope=${encodeURIComponent(
    "user-read-private user-read-email playlist-read-private playlist-read-collaborative playlist-modify-public playlist-modify-private"
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
  

