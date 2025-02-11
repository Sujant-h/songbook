#!/bin/bash

# Create an output folder for the compressed files
mkdir -p compressed_audio

# Loop through each MP3 file in the 'audio' folder
for file in audio/*.mp3; do
  # Extract the filename
  filename=$(basename "$file")
  echo "Compressing $filename..."

  # Compress using variable bitrate mode (adjust qscale value as needed)
  ffmpeg -i "$file" -codec:a libmp3lame -qscale:a 4 "compressed_audio/${filename}"
done

echo "Compression complete. Check the 'compressed_audio' folder."
