# Recorta una pieza isométrica de Gemini (fondo blanco liso, sombra suave al costado) y la guarda como PNG transparente.
# Uso: python3 herramientas/recortar_iso.py fuente.jpg salida.png [ancho_max]
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

ruta, salida = sys.argv[1], sys.argv[2]
ancho_max = int(sys.argv[3]) if len(sys.argv) > 3 else 600
img = Image.open(ruta).convert('RGB')
a = np.asarray(img).astype(int)
mx, mn = a.max(2), a.min(2)
lum = a.mean(2)
# Fondo: blanco casi puro, o la sombra suave (clara y apenas rosada) que Gemini tira al costado
claro = (mn > 205) & ((mx - mn) < 45)
contorno = ndimage.binary_dilation(lum < 150, iterations=2)
claro &= ~contorno
lab, n = ndimage.label(claro)
bordes = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
fondo = np.isin(lab, list(bordes))
fondo = ndimage.binary_opening(fondo, iterations=1, border_value=1)
alfa = np.where(fondo, 0, 255).astype(np.uint8)
alfa = np.asarray(Image.fromarray(alfa).filter(__import__('PIL.ImageFilter', fromlist=['x']).GaussianBlur(0.8)))
rgba = np.dstack([a.astype(np.uint8), alfa])
out = Image.fromarray(rgba, 'RGBA')
bbox = out.getbbox()
out = out.crop(bbox)
if out.width > ancho_max:
    out = out.resize((ancho_max, round(out.height * ancho_max / out.width)), Image.LANCZOS)
out.save(salida, optimize=True)
print(salida, out.size, bbox)
