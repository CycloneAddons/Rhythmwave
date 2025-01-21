from flask import Flask, request, jsonify
from flask_cors import CORS  # type: ignore # Import CORS
import yt_dlp as youtube_dl
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Ensure the directory for storing audio exists
os.makedirs('../frontend/public/audios', exist_ok=True)

@app.route('/stream', methods=['GET'])
def stream_audio():
    # Get the video URL from query parameters
    video_id = request.args.get('url')
    
    if not video_id:
        return jsonify({"error": "No Video Id Provided"}), 400
        
    try:
        
        file_path = f'../frontend/public/audios/{video_id}.webm'
        
        if os.path.exists(file_path):
            return jsonify({"message": f"File already exists", "fileName": f"{video_id}.webm"}), 200

        # Extract audio stream URL using yt-dlp
        ydl_opts = {
            'format': 'bestaudio/best',  # Best audio quality
            'extractaudio': True,  # Extract audio only
            'quiet': True,
            'force_generic_extractor': True,  # Force generic extractor if specific one fails
            'outtmpl': f'../frontend/public/audios/{video_id}.%(ext)s'
        }

        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
            url = f"https://www.youtube.com/watch?v={video_id}"
            info_dict = ydl.extract_info(url, download=True)
            video_id = info_dict['id']  # Get the video ID
            return jsonify({"message": "Audio extracted successfully", "fileName": f"{video_id}.webm"}), 200
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
if __name__ == '__main__':
    app.run(debug=True)
