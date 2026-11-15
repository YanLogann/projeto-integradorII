#!/bin/bash
# Codifica os quadros + mix em MP4 H.264 para Reels/TikTok.
# uso: scripts/encode.sh <dir_quadros> <fps_dos_quadros> <saida.mp4> [passo]
set -e
cd "$(dirname "$0")/.."
DIR=$1; FPS=$2; OUT=$3; STEP=${4:-1}
DUR=$(python3 -c "print(1/$FPS)"); LIST=$(mktemp); for f in $(ls "$DIR"/f_*.jpg | sort); do n=$(basename "$f" .jpg); n=$((10#${n#f_})); [ $((n % STEP)) -eq 0 ] && echo "file '$PWD/$f'" && echo "duration $DUR"; done > "$LIST"
ffmpeg -y -v error -f concat -safe 0 -i "$LIST" -i audio/mix_final.wav \
  -vf "fps=30,scale=1080:1920:flags=lanczos,format=yuv420p" \
  -c:v libx264 -profile:v high -level 4.2 -preset slow -crf 17 -maxrate 16M -bufsize 24M -g 60 -bf 2 \
  -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
  -c:a aac -b:a 320k -ar 48000 -ac 2 -t 60 -movflags +faststart "$OUT"
rm -f "$LIST"
ffprobe -v error -show_entries stream=codec_name,profile,width,height,r_frame_rate,pix_fmt,sample_rate,channels:format=duration,size,bit_rate -of default=nw=1 "$OUT"
