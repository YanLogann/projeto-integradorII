#!/usr/bin/env bash
# Mixagem final. Com public/audio/voice.wav presente, a trilha abaixa sob a fala (ducking).
set -e
cd "$(dirname "$0")/.."
A=public/audio
if [ -f $A/voice.wav ]; then
  ffmpeg -y -loglevel error -i $A/music.wav -i $A/sfx.wav -i $A/voice.wav -filter_complex \
   "[2]asplit[v][vk];[0]volume=0.55[m];[m][vk]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[md];\
    [md][1][v]amix=inputs=3:weights='1 0.9 1.25':normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9[out]" \
   -map "[out]" -ar 48000 $A/mix.wav
else
  ffmpeg -y -loglevel error -i $A/music.wav -i $A/sfx.wav -filter_complex \
   "[0]volume=0.55[m];[m][1]amix=inputs=2:weights='1 0.9':normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9[out]" \
   -map "[out]" -ar 48000 $A/mix.wav
fi
echo mix ok
