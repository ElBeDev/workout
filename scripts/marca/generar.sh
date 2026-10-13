#!/bin/zsh
# Genera todos los íconos de GainLine a partir de icon.sh (docs/rebrand-gainline.md §3).
# Mismo sistema que la firma de ElBe Games (Omeyocan/game/tools/splash.gd): Barlow Condensed
# ExtraBold en blanco hueso sobre negro y una línea de acento, que aquí es el verde de los anillos.
# Requiere ImageMagick 7 (`magick`). Se corre desde la raíz del repo:
#   zsh scripts/marca/generar.sh
set -e
D=${0:A:h}
R=${D:h:h}
T=$(mktemp -d)
ACENTO='#92E82A'   # --ring-sets en oscuro (src/app/globals.css)

$D/icon.sh $T/icon.png 1024 0.5 $ACENTO
# Android recorta el maskable hasta a un círculo del 80 %: el dibujo va más chico.
$D/icon.sh $T/maskable.png 1024 0.4 $ACENTO

magick $T/icon.png -resize 512x512 $R/src/app/icon.png
magick $T/icon.png -resize 512x512 $R/public/icon-512.png
magick $T/icon.png -resize 192x192 $R/public/icon-192.png
# iOS pinta de negro lo transparente; el fondo ya es negro opaco, pero se fuerza sin alfa.
magick $T/icon.png -resize 180x180 -alpha off $R/public/apple-touch-icon.png
magick $T/maskable.png -resize 512x512 $R/public/icon-maskable-512.png
magick $T/icon.png -define icon:auto-resize=48,32,16 $R/src/app/favicon.ico

# La firma del estudio, como la de ElBe Games pero con FIT y el verde.
$D/studio.sh $R/docs/marca/elbefit.png 2556 1179 FIT $ACENTO
cp $T/icon.png $R/docs/marca/gainline-1024.png

rm -rf $T $D/_*.png
echo "listo"
