import { NextResponse } from "next/server";
import { SpotifyWebApi } from "@spotify/web-api-ts-sdk";

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;
  const scopes = ["playlist-read-private", "playlist-read-collaborative"];

  const sdk = SpotifyWebApi.withUserAuthorization(clientId, redirectUri, scopes);
  const authUrl = sdk.authorizeURL;

  return NextResponse.redirect(authUrl);
}
