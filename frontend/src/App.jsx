import React, { useState, useEffect, useRef, useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBackwardStep, faBackward, faPlay, faPause, faForward, faForwardStep } from '@fortawesome/free-solid-svg-icons';
import './app.css';
import { AppContext } from "./Loading";
import { handleSearch, playSong } from './Utils/handleApi';
import {handleSongEnd} from './Utils/musicEvents';
import { handleSkip, handleBackward, handleForward, handlePauseResume, timeUpdate, loadedMetadata, mouseDown, mouseMove, mouseUp, updateProgress } from './Utils/musicControler';



const App = () => {
  const [ytUrl, setYtUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayingRN, setPlayingRN] = useState(false);

  const [isPause, setIsPause] = useState(false);
  const [previousSongs, setPreviousSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState({});
  const [searchClicked, setSearchClicked] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const { setIsLoading } = useContext(AppContext);
  const progressRef = useRef(null);
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const [queue, setQueue] = useState([]);
  const [isAutoPlayQueue, setIsAutoPlayQueue] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);

   
  const handlePlay = (id, title) => { playSong(id, title, setLoading, setIsLoading, audioRef, setCurrentSong, setAudioUrl, setIsPlaying, currentSong, setPreviousSongs, setPlayingRN, isPlayingRN);};
  const handleTimeUpdate  = () => { timeUpdate(isDragging, audioRef, setCurrentTime)};  
  const handleUpdateProgess = (e) => { updateProgress(e, progressRef, setCurrentTime, audioRef, duration)};
  const handleLoadedMetadata = () => { loadedMetadata(audioRef, setDuration)};
  const handleMouseDown = (e) => { mouseDown(e, setIsDragging, handleUpdateProgess)};
  const handleMouseMove = (e) => { mouseMove(e, isDragging, progressRef, duration, setCurrentTime)};
  const handleMouseUp = (e) => { mouseUp(e, isDragging, setIsDragging, handleUpdateProgess)};
  
  const fetchNextSongs = async () => {
    if (autoPlay && currentSong.id && !isAutoPlayQueue) {
      try {
        const response = await fetch(`https://cyclone-youtube-search.onrender.com/api/video/${currentSong.id}`);
        const data = await response.json();
        const nextSongs = data.map(song => ({
          id: song.videoId,
          title: song.title,
          addedBy: "autoplay"
        }));
        setQueue((prevQueue) => [...prevQueue, ...nextSongs]);
        setIsAutoPlayQueue(true);
        if(!isPlayingRN) {
          handleSongEnd(queue, handlePlay, setQueue, setPlayingRN, audioRef, setCurrentTime, setAudioUrl, setIsPause, setCurrentSong);
        }
      } catch (error) {
        console.error('Error fetching next songs:', error);
      }
    }
  };

  useEffect(() => {
    if(!autoPlay) {
      setQueue(queue.filter((song) => song.addedBy !== "autoplay"));
      setIsAutoPlayQueue(false);
    } else if(!isAutoPlayQueue && queue.length < 1) {
    fetchNextSongs();
    }
  }, [autoPlay]);

  useEffect(() => {
    if (audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = ""; // Clear the source to free memory
        audioRef.current = null; // Remove reference
      }
  
      // Create a new audio element
      const audioElement = new Audio(audioUrl);
      audioRef.current = audioElement;
      audioElement.addEventListener("timeupdate", handleTimeUpdate);
      audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);
      audioElement.addEventListener("ended", ()=> handleSongEnd(queue, handlePlay, setQueue, setPlayingRN, audioRef, setCurrentTime, setAudioUrl, setIsPause, setCurrentSong));
  
      // Play the audio
      audioElement.play();
  
      // Visualization setup
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 1024;
  
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
  
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext("2d");
  
      const draw = () => {
        analyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
  
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0.3, "#3ec7c9");
        gradient.addColorStop(1, "#05668d");
  
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
        if (audioElement) {
          audioElement.pause();
          audioElement.src = ""; // Clear the source to free memory
          audioElement.removeEventListener("timeupdate", handleTimeUpdate);
          audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
          audioElement.removeEventListener("ended",()=>  handleSongEnd(queue, handlePlay, setQueue, setPlayingRN, audioRef, setCurrentTime, setAudioUrl, setIsPause, setCurrentSong));
        }
          audioContext.close();
      };
    }
  }, [audioUrl]);
  
  
 

  
 
  
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
  }, [isDragging]);
 





  useEffect(() => {
    if (queue.length > 0 && !isPlayingRN) {
      handleSongEnd(queue, handlePlay, setQueue, setPlayingRN, audioRef, setCurrentTime, setAudioUrl, setIsPause, setCurrentSong);
        }
  }, [queue, isPlayingRN]);



  return (
  
<div className='app'>
    <div className={searchClicked ? "": 'main-bar'}>
      <h1>RhythmWave</h1>
      <div className="search-container">
        <input
          type="text"
          value={ytUrl}
          onChange={(e) => setYtUrl(e.target.value)}
          placeholder="Search for a song"
        />
        <button onClick={() =>
          handleSearch(ytUrl, setSearchClicked, setSearchResults, setLoading, setIsLoading)
        } disabled={loading}>
          Search
        </button>
      </div>
      </div>
      {searchResults.length > 0 && (
        <div className="results-container">
          <div className="results-scrollable">
            {searchResults.map((result) => (
              <div key={result.videoId} className="result-item">
                <img src={result.thumbnail} alt={result.title} />
                <div className="result-info">
                  <h3>{result.title}</h3>
                  <p className='ruploader'>Artists: {result.artists}</p>
                  <p className='rduration'>{result.duration}</p>
                </div>
                <button className="play-button" onClick={() => setQueue([...queue, {id: result.videoId, title: result.title, addedBy: "user" }])}>Add to Queue</button>
                <button className="play-button" onClick={() => handlePlay(result.videoId, result.title)} >Play</button>
              
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
            <button onClick={()=>  console.log("clicked")} >
        <FontAwesomeIcon icon={faBackwardStep} />
      </button>
      <button onClick={()=> handleBackward(audioRef)} >
        <FontAwesomeIcon icon={faBackward} />
      </button>
      <button onClick={()=> handlePauseResume(audioRef, isPause, setIsPause)} >
        <FontAwesomeIcon icon={isPause ? faPlay : faPause} />
      </button>
      <button onClick={()=> handleForward(audioRef)} >
        <FontAwesomeIcon icon={faForward} />
      </button>
      <button onClick={()=> handleSongEnd(queue, handlePlay, setQueue, setPlayingRN, audioRef, setCurrentTime, setAudioUrl, setIsPause, setCurrentSong)}>
        <FontAwesomeIcon icon={faForwardStep} />
      </button>
      <button onClick={()=> setAutoPlay(!autoPlay)}>
      
<svg xmlns="http://www.w3.org/2000/svg" width="20" height="27" viewBox="6 10 24 24" fill="none"  className="svgg">
{autoPlay && (
<g><path d="M14.18 9.58H8.42C4.88 9.58 2 12.46 2 16s2.88 6.42 6.42 6.42h5.76c-1.45-1.74-2.32-3.98-2.32-6.42s.87-4.68 2.32-6.42zM20.72 17.98 24.14 16l-3.42-1.98z" fill="#ffffff" opacity="1" data-original="#000000" ></path><path d="M21.93 7.93c-4.45 0-8.07 3.62-8.07 8.07s3.62 8.07 8.07 8.07S30 20.45 30 16s-3.62-8.07-8.07-8.07zm3.21 9.8-3.42 1.98c-.32.18-.66.27-1 .27-.35 0-.69-.09-1-.27-.63-.36-1-1.01-1-1.73v-3.96c0-.72.37-1.37 1-1.73.62-.36 1.37-.36 2 0l3.42 1.98c.63.36 1 1.01 1 1.73s-.37 1.37-1 1.73z" fill="#ffffff" opacity="1" data-original="#000000" ></path></g>
)}
{!autoPlay && (
<g><path d="M23.58 9.58h-5.76c1.45 1.74 2.32 3.98 2.32 6.42s-.87 4.68-2.32 6.42h5.76c3.54 0 6.42-2.88 6.42-6.42s-2.88-6.42-6.42-6.42z" fill="#ffffff" opacity="1" data-original="#000000"  ></path><path d="M10.07 7.93C5.62 7.93 2 11.55 2 16s3.62 8.07 8.07 8.07 8.07-3.62 8.07-8.07-3.62-8.07-8.07-8.07zM9.07 19c0 .55-.45 1-1 1s-1-.45-1-1v-6c0-.55.45-1 1-1s1 .45 1 1zm4 0c0 .55-.45 1-1 1s-1-.45-1-1v-6c0-.55.45-1 1-1s1 .45 1 1z" fill="#ffffff" opacity="1" data-original="#000000"  ></path></g>
)}
</svg>
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
