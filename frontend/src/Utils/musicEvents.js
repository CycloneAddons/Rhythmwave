export const handleSongEnd = (queue, handlePlay, setQueue, setPlayingRN, audioRef, setCurrentTime, setAudioUrl, setIsPause, setCurrentSong) => {
  if(audioRef.current) {audioRef.current.currentTime = 0}; setCurrentTime(0); setAudioUrl(""); setCurrentSong({ title: "Nothing To Play Right Now. Please Add Song in Queue." }); 
  if (queue.length > 0) {
    let nextSong = null;

    const userSong = queue.find(song => song.addedBy === "user");
    
    if (userSong) {
      nextSong = userSong;
    } else {
      const autoplaySong = queue.find(song => song.addedBy === "autoplay");
      if (autoplaySong) {
        nextSong = autoplaySong;
      }
    }
  
    if (nextSong) {
      handlePlay(nextSong.id, nextSong.title);  // Play the selected song
      setQueue(queue.filter(song => song.id !== nextSong.id));  // Remove the selected song from the queue
    } else {
      setPlayingRN(false);
      setIsPause(true);
    }  
    } else {
      setPlayingRN(false);
      setIsPause(true);
    }
  };
  
  