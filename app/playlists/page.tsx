import { redirect } from "next/navigation";
import PlaylistsClient from "./PlaylistsClient";

export default async function PlaylistsPage({ searchParams }: { searchParams: { accessToken?: string } }) {
  // Resolve `searchParams` and extract the token
  const token = searchParams?.accessToken;

  if (!token) {
    console.error("Access token is missing. Redirecting to login...");
    redirect("/api/auth"); // Redirect to authentication route
    return null; // Return to prevent further execution
  }

  try {
    // Fetch user data from Spotify
    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch user data from Spotify:", response.statusText);
      redirect("/api/auth"); // Redirect if user data fetch fails
      return null; // Return to prevent further execution
    }

    const userData = await response.json();

    console.log("Spotify User Data:", userData); // Debugging user data from Spotify

    // Render PlaylistsClient component with user data and token
    return (
      <PlaylistsClient
        user={{
          id: userData.id,
          profilePicture: userData.images?.[0]?.url || null, // Use Spotify profile picture or null
        }}
        token={token}
      />
    );
  } catch (error) {
    console.error("Error fetching Spotify user data:", error);
    redirect("/api/auth"); // Redirect in case of an error
    return null; // Return to prevent further execution
  }
}
