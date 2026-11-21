#!/usr/bin/env bash
# Monta public/audio/voice.wav: cada fala (sem o silêncio inicial) no seu quadro (30 fps).
set -e
cd "$(dirname "$0")/.."
V=public/audio/voice
# quadro de início de cada fala
STARTS=(8 95 237 342 477 590)
FILES=($(ls $V/l[1-6]_*.mp3 | sort))
IN=""; FC=""; MIX=""
for i in "${!FILES[@]}"; do
  ms=$(( ${STARTS[$i]} * 1000 / 30 ))
  IN="$IN -i ${FILES[$i]}"
  FC="$FC[$i]silenceremove=start_periods=1:start_threshold=-45dB,aresample=44100,adelay=${ms}|${ms}[v$i];"
  MIX="$MIX[v$i]"
done
ffmpeg -y -loglevel error $IN -filter_complex "${FC}${MIX}amix=inputs=${#FILES[@]}:normalize=0,apad=whole_dur=27,atrim=0:27,pan=stereo|c0=c0|c1=c0[out]" -map "[out]" -ar 44100 public/audio/voice.wav
echo voice ok
