import express from 'express';
import { Client } from 'youtubei';
import cors from 'cors';

const app = express();
const youtube = new Client();

app.use(cors()); // To allow cross-origin requests
app.use(express.json()); // To parse incoming JSON requests

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
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch search results' });
    }
});

// API endpoint to get next video details based on videoId
app.get('/api/video/:id', async (req, res) => {
    const videoId = req.params.id;

    try {
        const videoDetails = await getNextVideoDetails(videoId);
        res.json(videoDetails);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch video details' });
    }
});

const getYouTubeResults = async (query) => {
    const results = await youtube.search(query, {
        type: 'video',
    });

    const videos = results.items
        .filter(video => !video.isLive)
        .map(video => ({
            id: video.id,
            title: video.title,
            channelName: video.channel.name,
            thumbnail: video.thumbnails[1]?.url || video.thumbnails[0]?.url || null,
            duration: formatDuration(video.duration),
        }));

    return videos;
};

const getNextVideoDetails = async (videoId) => {
    const result = await youtube.getVideo(videoId);
    const video = result.related.items.find(item => !item.isLive);

    return {
        id: video.id,
        title: video.title,
        channelName: video.channel.name,
        thumbnail: video.thumbnails[1].url || video.thumbnails[0].url,
        duration: formatDuration(video.duration),
    };
};

const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
};

// Start the server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
