#!/usr/bin/env bash
# Monta public/audio/voice.wav a partir da tomada única (Eleven v4, voz Yan v1, em cache):
# corta cada frase pelos tempos de palavra e encaixa cada uma no seu quadro (30 fps).
set -e
cd "$(dirname "$0")/.."
TAKE=public/audio/takes/C_v4.mp3
CUTS=(0.00 3.05 6.40 9.26 11.75 14.55 18.00)   # limites das 6 frases na tomada (s)
STARTS=(8 95 237 342 477 590)                  # quadro de entrada de cada frase
FC=""; MIX=""
for i in 0 1 2 3 4 5; do
  a=${CUTS[$i]}; b=${CUTS[$((i+1))]}
  ms=$(( ${STARTS[$i]} * 1000 / 30 ))
  FC="$FC[0]atrim=$a:$b,asetpts=PTS-STARTPTS,silenceremove=start_periods=1:start_threshold=-45dB,afade=t=out:st=$(python3 -c "print(max(0,$b-$a-0.12))"):d=0.1,adelay=${ms}|${ms}[v$i];"
  MIX="$MIX[v$i]"
done
ffmpeg -y -loglevel error -i $TAKE -filter_complex "${FC}${MIX}amix=inputs=6:normalize=0,apad=whole_dur=27,atrim=0:27,aresample=44100,pan=stereo|c0=c0|c1=c0[out]" -map "[out]" public/audio/voice.wav
echo voice ok
