#!/bin/bash
# prancha de contato: scripts/contact.sh dir out.jpg
cd "$1" && montage $(ls t_*.jpg | sort -t_ -k2 -g) -tile 5x -geometry 324x576+4+4 -background '#222' -fill white -pointsize 18 -label '%f' "$2"
