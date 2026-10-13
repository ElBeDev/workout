#!/bin/zsh
# uso: icon.sh <salida> <lado> <escala-del-contenido 0-1> <acento>
set -e
D=${0:A:h}; OUT=$1; N=$2; K=$3; ACC=${4:-#92E82A}
F=${D:h:h}/src/fonts/BarlowCondensed-ExtraBold.ttf
# "GL" sin márgenes
magick -background none -fill '#f4f1ea' -font $F -kerning $((N*K*-0.02)) -pointsize $((N*K*1.2)) label:GL -trim +repage $D/_gl.png
W=$(magick identify -format %w $D/_gl.png); H=$(magick identify -format %h $D/_gl.png)
LW=$(( W * 0.78 )); LH=$(( N * K * 0.035 )); GAP=$(( N * K * 0.075 ))
TOT=$(( H + GAP + LH ))
Y0=$(( (N - TOT) / 2 ))
X0=$(( (N - W) / 2 ))
LX=$(( (N - LW) / 2 )); LY=$(( Y0 + H + GAP ))
magick -size ${N}x${N} xc:black \
  $D/_gl.png -geometry +${X0%.*}+${Y0%.*} -composite \
  -fill "$ACC" -draw "roundrectangle ${LX%.*},${LY%.*} $(( LX + LW )),$(( LY + LH )) $((LH/2)),$((LH/2))" \
  $OUT
