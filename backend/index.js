import { Client } from 'youtubei';
const youtube = new Client();;
import express from 'express';
import YTMusicAPI from "lite-ytmusic-api";
const ytmusic = new YTMusicAPI();
import cors from 'cors';

const app = express();
app.use(cors()); // Allow cross-origin requests
app.use(express.json()); // Parse incoming JSON requests


(async() => {
    await ytmusic.initialize();
})();


// Helper function to format error messages
const handleError = (res, error, message) => {
    console.error(`${message}:`, error); // Log the error to the server console
    res.status(500).json({
        error: message,
        details: error.message || error,
    });
};



// API endpoint to get YouTube search results
app.get('/api/search', async (req, res) => {
    const query = req.query.query;

    if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
    }

    try {
        const videos = await getYouTubeResults(query);
        res.json(videos);
    } catch (error) {
        handleError(res, error, 'Failed to fetch search results');
    }
});

// API endpoint to get next video details based on videoId
app.get('/api/video/:id', async (req, res) => {
    const videoId = req.params.id;
 const data = await ytmusic.getUpNexts(videoId);
    res.json(data);
});
const getYouTubeResults = async (query) => {
    let data;
    try {
        data = await ytmusic.searchSongs(query);
    } catch (e) {
        let results;
        try {
            results = await youtube.search(query, {
                type: 'video',
            });
        } catch (searchError) {
            console.error('YouTube search failed', searchError);
            return []; // Return empty array if search fails
        }

        data = results.items
            .filter((video) => !video.isLive && video.id) // Ensure video.id exists
            .map((video) => ({
                videoId: video.id,
                title: video.title || 'Unknown Title',
                artists: video.channel?.name || 'Unknown Channel',
                thumbnail: video.thumbnails[1]?.url || video.thumbnails[0]?.url || null,
                duration: formatDuration(video.duration || 0),
            }));
    }
    return data;
};

const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
