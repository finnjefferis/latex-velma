import Image from "next/image";

// Spotify types
type Playlist = {
  id: string;
  name: string;
  description: string;
  images: { url: string }[];
  tracks: { total: number; items: any[] };
};

async function fetchPlaylists(token: string, playlistIds: string[]): Promise<Playlist[]> {
  const playlists = await Promise.all(
    playlistIds.map(async (id) => {
      const response = await fetch(`https://api.spotify.com/v1/playlists/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching playlist ${id}: ${response.statusText}`);
      }

      return await response.json();
    })
  );
  return playlists;
}

async function getAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;
  const authUrl = `https://accounts.spotify.com/api/token`;

  const params = new URLSearchParams({
    grant_type: "client_credentials", // Use client credentials flow for simplicity
  });

  const response = await fetch(authUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: params.toString(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Error fetching access token: ${data.error_description}`);
  }

  return data.access_token;
}

export default async function HomePage() {
  const playlistIds = ["4wOKl0V3Hy5QnNUmYxM6Tk", "2QgT7vxgcZNLpiIPhuJDo0"];
  const token = await getAccessToken();
  const playlists = await fetchPlaylists(token, playlistIds);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-6">My Playlists</h1>

      {playlists.map((playlist) => (
        <div key={playlist.id} className="mb-8 w-full max-w-3xl">
          {/* Playlist Header */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <Image
              src={playlist.images[0]?.url}
              alt={`${playlist.name} cover`}
              width={192}
              height={192}
              className="rounded-md shadow-md"
            />
            <h2 className="text-2xl font-semibold">{playlist.name}</h2>
            <p className="text-sm text-gray-400">{playlist.description || "No description available."}</p>
            <p className="text-sm text-gray-400">Total Tracks: {playlist.tracks.total}</p>
          </div>

          {/* Playlist Tracks */}
          <ul className="w-full">
            {playlist.tracks.items.map((item: any) => {
              const track = item.track;
              return (
                <li
                  key={track.id}
                  className="flex items-center gap-4 p-2 border-b border-gray-700 last:border-b-0"
                >
                  <Image
                    src={track.album.images[0]?.url}
                    alt={track.name}
                    width={48}
                    height={48}
                    className="rounded"
                  />
                  <div>
                    <p className="font-medium">{track.name}</p>
                    <p className="text-sm text-gray-400">
                      {track.artists.map((artist: any) => artist.name).join(", ")}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
