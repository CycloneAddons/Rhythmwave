import React, { useState, useEffect, useRef } from 'react';
import './app.css';
const App = () => {
  const [ytUrl, setYtUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPause, setIsPause] = useState(false);
  const [previousSongs, setPreviousSongs] = useState([]); // Now an array to store all previous songs
  const [currentSong, setCurrentSong] = useState({});
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Handle search
  const handleSearch = async () => {
    if (!ytUrl) return;
    setLoading(true);

    try {
        const response = await fetch(`http://localhost:3000/api/search?query=${encodeURIComponent(ytUrl)}`);
        if (response.ok) {
            const data = await response.json();
            setSearchResults(data);  // Set search results in state
        } else {
            console.error('Error fetching search results:', response.statusText);
        }
    } catch (err) {
        console.error('Error searching:', err);
    } finally {
        setLoading(false);  // Stop loading after the request
    }
  };

  const handlePlay = async (id, title) => {
    setLoading(true);
    setAudioUrl(''); 
    setCurrentSong({ id, title }); 
  
    if (audioRef.current) {
      audioRef.current.pause();  // Pause current song
    }
  
    try {
      const response = await fetch(`http://127.0.0.1:5000/stream?url=${encodeURIComponent(id)}`, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        setAudioUrl(`/audios/${data.fileName}`);
        setIsPlaying(true);
        if (currentSong.id === id) {
          return;  
        } //
        setPreviousSongs((prev) => [...prev, { id, title }]);  // This keeps track of all songs played
      } else {
        alert('Error retrieving audio');
      }
    } catch (err) {
      alert('Error processing request');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle skip
  const handleSkip = async () => {
    try {
        const response = await fetch(`http://localhost:3000/api/video/${currentSong.id}`);
        
        if (response.ok) {
            const newSkip = await response.json();
            handlePlay(newSkip.id, newSkip.title);  // Call handlePlay with the new video details
        } else {
            console.error('Error fetching next video details:', response.statusText);
        }
    } catch (err) {
        console.error('Error skipping to next video:', err);
    }
  };

  const handlePrevious = () => {
    if (previousSongs.length > 1) {  // Ensure there's more than one song in the history
      const prevSongsCopy = [...previousSongs]; // Copy the array to avoid mutating state directly
      const prevSong = prevSongsCopy[prevSongsCopy.length - 2];  // Get the second last song in the array
      prevSongsCopy.pop();  // Remove the current song from the array
      setPreviousSongs(prevSongsCopy);  // Update the state with the new array
      handlePlay(prevSong.id, prevSong.title);  // Play the previous song
    } else {
      alert("No previous song available");
    }
  };

  const handlePauseResume = () => {
    if (!isPause) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPause(!isPause);
  };

  const handleForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime += 10; // forward by 10 seconds
    }
  };

  const handleBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime -= 10; // backward by 10 seconds
    }
  };

  // Update current time and progress bar
  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);

      if (progressBarRef.current) {
        progressBarRef.current.value = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      }
    }
  };

  // Handle progress bar interaction
  const handleProgressChange = (e) => {
    const newTime = (e.target.value / 100) * audioRef.current.duration;
    audioRef.current.currentTime = newTime;
  };

  
  useEffect(() => {
    if (audioUrl) {
      const audioElement = new Audio(audioUrl); // Create a new audio element
      audioRef.current = audioElement;
  
      audioElement.play();
  
      // Create new audio context and analyser
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512; // Decrease fftSize for more bars
  
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
  
      // Connect audio element to analyser
      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
  
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      sourceNodeRef.current = source;
  
      const canvas = canvasRef.current;
      canvas.width = 1348; // Increase the canvas width for more bars
      const ctx = canvas.getContext('2d');
  
      // Draw visualizer
      const draw = () => {
        analyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
  
        // Create a gradient for the bars
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#32a852'); // Blue-greenish top color
        gradient.addColorStop(1, '#05668d'); // Darker blue-greenish bottom color
  
        const barWidth = canvas.width / bufferLength;
        let x = 0;
  
        for (let i = 0; i < bufferLength; i++) {
          const barHeight = dataArray[i];
          ctx.fillStyle = gradient;
          ctx.fillRect(x, canvas.height - barHeight / 2, barWidth, barHeight);
          x += barWidth + 1; // 1px gap between each bar
        }
  
        animationFrameRef.current = requestAnimationFrame(draw);
      };
  
      draw();
  
      // Update current time
      const timeInterval = setInterval(updateProgress, 1000); // Update every second
  
      // Cleanup function
      return () => {
        clearInterval(timeInterval);
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [audioUrl]);
  
  

  // Add this function to format the time
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  return (
    <div className="app">
      <h1>RhythmWave</h1>

      <div className="search-container">
        <input
          type="text"
          value={ytUrl}
          onChange={(e) => setYtUrl(e.target.value)}
          placeholder="Search for a song"
        />
        <button onClick={handleSearch} disabled={loading}>
          Search
        </button>
      </div>

      {loading && <p>Loading...</p>}

      { searchResults.length > 0 && (
        <div className="results-container">
          <div className="results-scrollable">
            {searchResults.map((result) => (
              <div key={result.id} className="result-item" onClick={() => handlePlay(result.id, result.title)}>
                <img src={result.thumbnail} alt={result.title} />
                <div className="result-info">
                  <h3>{result.title}</h3>
                  <p>{result.channelName}</p>
                  <p>{result.duration}</p>
                </div>
                <button className="play-button">Play</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isPlaying && (
        <div className="play-container">
          {/* <div className="search-results-shifted">
            <div className="results-scrollable">
              {searchResults.map((result) => (
                <div key={result.id} className="result-item" onClick={() => handlePlay(result.id, result.title)}>
                  <img src={result.thumbnail} alt={result.title} />
                  <div className="result-info">
                    <h3>{result.title}</h3>
                    <p>{result.channelName}</p>
                    <p>{result.duration}</p>
                  </div>
                  <button className="play-button">Play</button>
                </div>
              ))}
            </div>
          </div> */}

          <div className="current-play-container">
            <div className="audio-info">
              <h2>{currentSong.title}</h2>
            </div>

            <div className="controls-container">
            <button onClick={handlePrevious}>Previous</button>
              <button onClick={handleBackward}>Backward</button>
              <button onClick={handlePauseResume}>
                {isPause ? 'Play' : 'Pause'}
              </button>
              <button onClick={handleForward}>Forward</button>
              <button onClick={handleSkip}>Skip</button>
            </div>

            <div className="progress-bar-container">
              <div className="time-display">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              <input
                type="range"
                ref={progressBarRef}
                min="0"
                max="100"
                value={(currentTime / duration) * 100 || 0}
                onChange={handleProgressChange}
              />
            </div>

            <div className="visualizer-container">
              <canvas ref={canvasRef} className="visualizer-canvas" width="600" height="200"></canvas>
            </div>

            <audio
              ref={audioRef}
              src={currentSong.url}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
