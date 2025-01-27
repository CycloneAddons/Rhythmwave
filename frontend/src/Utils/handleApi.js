export const handleSearch = async (ytUrl, setSearchClicked, setSearchResults, setLoading, setIsLoading) => {
    if (!ytUrl) return;
    setLoading(true);
    setIsLoading(true);
  
    try {
      const response = await fetch(
        `https://cyclone-youtube-search.onrender.com/api/search?query=${encodeURIComponent(ytUrl)}`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchClicked(true);
        setSearchResults(data);
      } else {
        console.error('Error fetching search results:', response.statusText);
      }
    } catch (err) {
      console.error('Error searching:', err);
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };
  


  export const playSong = async (
    id,
    title,
    setLoading,
    setIsLoading,
    audioRef,
    setCurrentSong,
    setAudioUrl,
    setIsPlaying,
    currentSong,
    setPreviousSongs,
    setPlayingRN,
    isPlayingRN
  ) => {
    if(id === currentSong.id && isPlayingRN) return;
    setLoading(true);
    setIsLoading(true);
  
    if (audioRef.current) {
      audioRef.current.pause();
    }
  
    setCurrentSong({ id, title });
  
    try {
      const response = await fetch(
        `https://rhythmwave.onrender.com/stream?url=${encodeURIComponent(id)}`,
        { method: 'GET' }
      );
  
      if (response.ok) {
        const data = await response.json();
        setAudioUrl(`/audios/${data.fileName}`);
        setIsPlaying(true);
        setPlayingRN(true);
        if (currentSong.id === id) {
          return;
        }
        } else {
        alert('Error retrieving audio');
      }
    } catch (err) {
      alert('Error processing request');
    } finally {
      setLoading(false);
      setIsLoading(false);
    }
  };
  