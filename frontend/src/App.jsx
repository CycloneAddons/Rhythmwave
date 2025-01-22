import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBackwardStep, faBackward, faPlay, faPause, faForward, faForwardStep } from '@fortawesome/free-solid-svg-icons';
import './app.css';

const App = () => {
  const [ytUrl, setYtUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPause, setIsPause] = useState(false);
  const [previousSongs, setPreviousSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState({});
  const [searchClicked, setSearchClicked] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const progressRef = useRef(null);
  const audioRef = useRef(null);
  const canvasRef = useRef(null);

  const handleSearch = async () => {
    if (!ytUrl) return;
    setLoading(true);
    try {
      const response = await fetch(`https://cyclone-youtube-search.onrender.com/api/search?query=${encodeURIComponent(ytUrl)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchClicked(true)
        setSearchResults(data);
        
      } else {
        console.error('Error fetching search results:', response.statusText);
      }
    } catch (err) {
      console.error('Error searching:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = async (id, title) => {
    setLoading(true);
    setAudioUrl('');
    setCurrentSong({ id, title });

    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      const response = await fetch(`http://127.0.0.1:5000/stream?url=${encodeURIComponent(id)}`, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        setAudioUrl(`/audios/${data.fileName}`);
        setIsPlaying(true);
        if (currentSong.id === id) {
          return;
        }
        setPreviousSongs((prev) => [...prev, { id, title }]);
      } else {
        alert('Error retrieving audio');
      }
    } catch (err) {
      alert('Error processing request');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    try {
      const response = await fetch(`https://cyclone-youtube-search.onrender.com/api/video/${currentSong.id}`);
      if (response.ok) {
        const newSkip = await response.json();
        handlePlay(newSkip.id, newSkip.title);
      } else {
        console.error('Error fetching next video details:', response.statusText);
      }
    } catch (err) {
      console.error('Error skipping to next video:', err);
    }
  };

  const handlePrevious = () => {
    if (previousSongs.length > 1) {
      const prevSongsCopy = [...previousSongs];
      const prevSong = prevSongsCopy[prevSongsCopy.length - 2];
      prevSongsCopy.pop();
      setPreviousSongs(prevSongsCopy);
      handlePlay(prevSong.id, prevSong.title);
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
      audioRef.current.currentTime += 10;
    }
  };

  const handleBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime -= 10;
    }
  };


  useEffect(() => {
    if (audioUrl) {
      const audioElement = new Audio(audioUrl);
      audioRef.current = audioElement;

      audioElement.play();
      audioElement.addEventListener("timeupdate", handleTimeUpdate);
      audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);

      // Visualization setup (as in your code)
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024; 

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);

      const canvas = canvasRef.current;
      canvas.width = window.innerWidth; // Full width of the window
      canvas.height = window.innerHeight / 1.2; // Increased height for better display
      const ctx = canvas.getContext('2d');

      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      
      const draw = () => {
        analyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0.3, '#3ec7c9');
        gradient.addColorStop(1, '#05668d');

        const barWidth = canvas.width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = dataArray[i] * 2;
          ctx.fillStyle = gradient;
          ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }

        requestAnimationFrame(draw);
      };

      draw();

      return () => {
        audioElement.pause();
        audioElement.removeEventListener("timeupdate", handleTimeUpdate);
        audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
        audioContext.close();
      };
    }
  }, [audioUrl]);

  const handleTimeUpdate = () => {
    if (!isDragging) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    updateProgress(e); // Update immediately on mouse down
  };
  

  const handleMouseMove = (e) => {
    if (isDragging) {
      updateProgress(e);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      if (audioRef.current) {
        audioRef.current.currentTime = currentTime; 
        audioRef.current.play();
        
      }
    }
  };
  
  const updateProgress = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const offsetX = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
    const newTime = (offsetX / rect.width) * duration;
    setCurrentTime(newTime); // Update UI state
  };
  
  
  
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
  
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, currentTime]);
  
  useEffect(() => {
    const syncProgress = () => setCurrentTime(audioRef.current?.currentTime || 0);
    audioRef.current?.addEventListener("timeupdate", syncProgress);
  
    return () => {
      audioRef.current?.removeEventListener("timeupdate", syncProgress);
    };
  }, []);
  

  const handleProgressBarClick = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const offsetX = Math.min(Math.max(0, e.clientX - rect.left), rect.width);
    const newTime = (offsetX / rect.width) * duration;
  
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime; 
      audioRef.current.play(); 
    }
  };

  useEffect(() => {
    const progressElement = progressRef.current;
    if (progressElement) {
      progressElement.addEventListener("click", handleProgressBarClick);
    }
  
    return () => {
      if (progressElement) {
        progressElement.removeEventListener("click", handleProgressBarClick);
      }
    };
  }, [duration]);
  


  return (
    <div className="app">
      <div className={searchClicked ? "": 'main-bar'}>
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
      </div>
      {searchResults.length > 0 && (
        <div className="results-container">
          <div className="results-scrollable">
            {searchResults.map((result) => (
              <div key={result.id} className="result-item" onClick={() => handlePlay(result.id, result.title)}>
                <img src={result.thumbnail} alt={result.title} />
                <div className="result-info">
                  <h3>{result.title}</h3>
                  <p className='ruploader'>Uploaded By {result.channelName}</p>
                  <p className='rduration'>{result.duration}</p>
                </div>
                <button className="play-button">Play</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isPlaying && (
        <div className="play-container">
          <div className="current-play-container">
            <div className="audio-info">
              <h2>{currentSong.title}</h2>
            </div>


            <div className="progress-bar" ref={progressRef} onMouseDown={handleMouseDown}>
            <div className="progress" style={{ width: `${(currentTime / duration) * 100}%` }}></div>
            </div>

          <div className="time-info">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          
            <div className="controls-container">
            <button onClick={handlePrevious}>
        <FontAwesomeIcon icon={faBackwardStep} />
      </button>
      <button onClick={handleBackward}>
        <FontAwesomeIcon icon={faBackward} />
      </button>
      <button onClick={handlePauseResume}>
        <FontAwesomeIcon icon={isPause ? faPlay : faPause} />
      </button>
      <button onClick={handleForward}>
        <FontAwesomeIcon icon={faForward} />
      </button>
      <button onClick={handleSkip}>
        <FontAwesomeIcon icon={faForwardStep} />
      </button>
            </div>




            <div className="visualizer-container">
              <canvas ref={canvasRef} className="visualizer-canvas" width="600" height="200"></canvas>
            </div>

            
          </div>
        </div>
      )}
    </div>
  );
};


const formatTime = (time) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};


export default App;
