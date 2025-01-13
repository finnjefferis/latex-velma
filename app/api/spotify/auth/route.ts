import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
  const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!;
  const scopes = [
    "playlist-modify-public",
    "playlist-modify-private",
    "playlist-read-private",
  ].join(" ");
  

  // Generate Spotify authorization URL
  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${encodeURIComponent(
    clientId
  )}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
console.log("scope", authUrl)
  return NextResponse.redirect(authUrl);
}
