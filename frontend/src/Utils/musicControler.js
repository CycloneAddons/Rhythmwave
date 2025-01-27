export const handleSkip = async (queue, currentSong, handleSongEnd, handlePlay, setQueue) => {
    if (queue.length > 0) {
        handleSongEnd(queue, handlePlay, setQueue)
        return;
      }
  
      try {
        const response = await fetch(`https://cyclone-youtube-search.onrender.com/api/video/${currentSong.id}`);
        if (response.ok) {
          const newSkip = await response.json();
          handlePlay(newSkip[0].videoId, newSkip[0].title);
        } else {
          console.error('Error fetching next video details:', response.statusText);
        }
      } catch (err) {
        console.error('Error skipping to next video:', err);
      }
  };
  


  export const handlePauseResume = (audioRef, isPause, setIsPause) => {
    setIsPause(!isPause);
    if (audioRef.current) {
    if (!isPause) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  }
  };
  
  export const handleForward = (audioRef) => {
    if (audioRef.current) {
      audioRef.current.currentTime += 10;
    }
  };
  
  export const handleBackward = (audioRef) => {
    if (audioRef.current) {
      audioRef.current.currentTime -= 10;
    }
  };
  

  
    export const handlePrevious = () => {
      if (previousSongs.length > 1) {
        const prevSongsCopy = [...previousSongs];
        const prevSong = prevSongsCopy[prevSongsCopy.length - 2];
        prevSongsCopy.pop();
        setPreviousSongs(prevSongsCopy);
        handlePlay(prevSong.videoId, prevSong.title);
      } else {
        alert("No previous song available");
      }
    };













//Progress Bar Controler
export const timeUpdate = (isDragging, audioRef, setCurrentTime) => {
  if (!isDragging && audioRef.current) {
    setCurrentTime(audioRef.current.currentTime);
  }
};

export const loadedMetadata = (audioRef, setDuration) => {
  if (audioRef.current) {
    setDuration(audioRef.current.duration);
  }
};

export const mouseDown = (e, setIsDragging, updateProgress) => {
  setIsDragging(true);
  updateProgress(e); // Reflect changes immediately when dragging starts
};

export const mouseMove = (e, isDragging, updateProgress, duration, setCurrentTime) => {
  if (isDragging) {
    const newTime = calculateNewTime(e, updateProgress, duration)
    setCurrentTime(newTime);
  }
};

export const mouseUp = (e, isDragging, setIsDragging, updateProgress) => {
  if (isDragging) {
    setIsDragging(false);
    updateProgress(e); // Reflect changes immediately when dragging starts
  }
};

const calculateNewTime = (e, progressRef, duration) => {
  if (!progressRef.current) return 0; // Safeguard against null references
  const rect = progressRef.current.getBoundingClientRect();
  const offsetX = e.clientX - rect.left;
  const percentage = Math.min(Math.max(offsetX / rect.width, 0), 1);
  return percentage * duration;
};

export const updateProgress = (e, progressRef, setCurrentTime, audioRef, duration) => {
  const newTime = calculateNewTime(e, progressRef, duration);
  setCurrentTime(newTime);
  if (audioRef.current) {
    audioRef.current.currentTime = newTime;
  }
};