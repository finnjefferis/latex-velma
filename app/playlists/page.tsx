import { redirect } from "next/navigation";
import PlaylistsClient from "./PlaylistsClient";

export default async function PlaylistsPage(context: { searchParams: { accessToken?: string } }) {
  const { searchParams } = context;
  const token = searchParams?.accessToken;

  if (!token) {
    console.error("Access token is missing. Redirecting to login...");
    redirect("/api/auth");
    return null; // Ensure no further code executes
  }

  try {
    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch user data from Spotify:", response.statusText);
      redirect("/api/auth");
      return null;
    }

    const userData = await response.json();
    console.log("Spotify User Data:", userData);

    return (
      <PlaylistsClient
        user={{
          id: userData.id,
          profilePicture: userData.images?.[0]?.url || null, // Use the first profile picture or null if unavailable
        }}
        token={token}
      />
    );
  } catch (error) {
    console.error("Error fetching Spotify user data:", error);
    redirect("/api/auth");
    return null;
  }
}
