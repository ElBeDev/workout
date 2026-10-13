#!/bin/zsh
# Firma de estudio al estilo del arranque de ElBe Games (Omeyocan/game/tools/splash.gd):
# «ElBe» en blanco con la «l» alzada, una línea de acento y el apellido espaciado en gris.
# uso: studio.sh <salida> <ancho> <alto> <apellido> <acento> [fondo]
set -e
D=${0:A:h}; OUT=$1; W=$2; H=$3; SUB=$4; ACC=$5; BG=${6:-black}
F=${D:h:h}/src/fonts/BarlowCondensed-ExtraBold.ttf; F2=$D/BarlowSemiCondensed-SemiBold.ttf
P=$(( H * 0.212 ))   # 250 px sobre 1179 en el original
piece() { # $1 texto $2 salida: alto fijo de línea, recortado sólo a lo ancho
  magick -background none -fill '#f4f1ea' -font $F -pointsize $P label:"$1" $D/_raw.png
  local g=$(magick $D/_raw.png -format %@ info:); local gw=${g%%x*}; local gx=$(echo $g | sed -E 's/.*\+([0-9]+)\+[0-9]+$/\1/')
  local hh=$(magick identify -format %h $D/_raw.png)
  magick $D/_raw.png -crop ${gw}x${hh}+${gx}+0 +repage $2
}
piece E $D/_e.png; piece l $D/_l.png; piece Be $D/_be.png
LH=$(magick identify -format %h $D/_l.png)
# la «l» crece 17 % hacia arriba desde la línea base (≈ 78 % del alto de la línea en Barlow)
BASE=$(( LH * 0.78 )); NEWH=$(( LH * 0.78 * 1.17 + LH * 0.22 ))
magick $D/_l.png -crop x${BASE%.*}+0+0 +repage -resize 100%x117% $D/_lt.png
magick $D/_l.png -crop x$(( LH - ${BASE%.*} ))+0+${BASE%.*} +repage $D/_lb.png
magick $D/_lt.png $D/_lb.png -background none -append $D/_l2.png
EXTRA=$(( $(magick identify -format %h $D/_l2.png) - LH ))
SEP=$(( H * 0.012 ))
magick -background none \( $D/_e.png -gravity south -extent x$(( LH + EXTRA )) \) \( -size ${SEP%.*}x1 xc:none \) $D/_l2.png \( -size ${SEP%.*}x1 xc:none \) \( $D/_be.png -gravity south -extent x$(( LH + EXTRA )) \) -gravity south +append -trim +repage $D/_name.png
NW=$(magick identify -format %w $D/_name.png); NH=$(magick identify -format %h $D/_name.png)
magick -background none -fill '#8d8a84' -font $F2 -pointsize $(( H * 0.046 )) -kerning $(( H * 0.022 )) label:"$SUB" -trim +repage $D/_sub.png
SW=$(magick identify -format %w $D/_sub.png)
CX=$(( W / 2 )); NY=$(( H / 2 - NH * 0.62 ))
LY=$(( NY + NH + H * 0.03 )); LW=$(( H * 0.127 )); LT=$(( H * 0.0045 + 1 ))
SY=$(( LY + LT + H * 0.026 ))
magick -size ${W}x${H} xc:$BG \
  $D/_name.png -geometry +$(( CX - NW / 2 ))+${NY%.*} -composite \
  -fill "$ACC" -draw "rectangle $(( CX - LW / 2 )),${LY%.*} $(( CX + LW / 2 )),$(( LY + LT ))" \
  $D/_sub.png -geometry +$(( CX - SW / 2 ))+${SY%.*} -composite $OUT
