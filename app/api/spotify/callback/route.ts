import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI!;

  // Extract the authorization code from the query string
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    console.error("Missing authorization code. Callback URL:", req.nextUrl.href);
    return NextResponse.json({ error: "Missing authorization code" }, { status: 400 });
  }

  try {
    // Exchange the authorization code for an access token
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await response.json();

    if (!response.ok) {
      console.error("Token exchange failed:", tokenData);
      return NextResponse.json({ error: tokenData.error_description || "Token exchange failed" }, { status: 500 });
    }

    console.log("Access Token:", tokenData.access_token);

    // Redirect to the playlists page with the access token
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    return NextResponse.redirect(`${baseUrl}/playlists?accessToken=${tokenData.access_token}`);
  } catch (error) {
    console.error("Error handling Spotify callback:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
