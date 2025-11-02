import fetch from 'node-fetch';

export default async function handler(req, res) {
  // 1. Get the API Key from Environment Variables
  const apiKey = process.env.YOUTUBE_API_KEY;

  // 2. Check if the API Key exists. If not, crash with a clear error.
  if (!apiKey) {
    return res.status(500).json({ error: 'YOUTUBE_API_KEY is not configured in Vercel environment variables.' });
  }

  // 3. Get the search query from the URL
  const { query, pageToken } = req.query;
  if (!query) {
    return res.status(400).json({ error: 'A search query parameter is required.' });
  }

  // 4. Construct the YouTube API URL
  let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&maxResults=10&key=${apiKey}`;
  if (pageToken) {
    searchUrl += `&pageToken=${pageToken}`;
  }

  try {
    // 5. First API call: Search for channels by keyword
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    // If YouTube returned an error (e.g., bad API key), send it to the user
    if (searchData.error) {
        return res.status(500).json({ error: searchData.error.message });
    }

    if (!searchData.items || searchData.items.length === 0) {
        return res.status(200).json({ items: [], nextPageToken: null });
    }

    // 6. Get all the channel IDs from the search results
    const channelIds = searchData.items.map(item => item.id.channelId).join(',');

    // 7. Second API call: Get detailed statistics for those channels
    const statsUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelIds}&key=${apiKey}`;
    const statsResponse = await fetch(statsUrl);
    const statsData = await statsResponse.json();

    // 8. Send the combined, detailed data back to the front-end
    res.status(200).json({
      items: statsData.items,
      nextPageToken: searchData.nextPageToken,
    });

  } catch (error) {
    // This catches any other network-related errors
    res.status(500).json({ error: 'Failed to fetch data from YouTube API. ' + error.message });
  }
}