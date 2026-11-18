# Saca el "fondo transparente" falso (cuadriculado gris y blanco) que dibuja Gemini y arma
# el avatar (cabeza y hombros) y el cuerpo entero, livianos.
# Uso: python3 herramientas/recortar.py nombre imagen.jpg [carpeta_destino]
import sys
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

nombre, ruta = sys.argv[1], sys.argv[2]
destino = sys.argv[3] if len(sys.argv) > 3 else 'assets/img'
a = np.asarray(Image.open(ruta).convert('RGB')).astype(int)
mx, mn = a.max(2), a.min(2)
lum = a.mean(2)
sat = mx - mn

# Fondo: gris claro sin color, pegado al borde de la imagen
gris = (sat < 22) & (mn > 175)
# El contorno del dibujo, un poco engrosado, para que el relleno no se escape por huecos chicos (pelo canoso, remeras blancas)
contorno = ndimage.binary_dilation(lum < 120, iterations=3)
gris &= ~contorno
lab, n = ndimage.label(gris)
bordes = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
fondo = np.isin(lab, list(bordes))
# Huecos encerrados (entre las piernas, bajo el brazo): son fondo si tienen los dos tonos del cuadriculado
for i in range(1, n + 1):
    if i in bordes:
        continue
    zona = lab == i
    if zona.sum() < 300:
        continue
    v = lum[zona]
    if v.std() > 9 and ((v > 238).mean() > 0.2) and ((v < 228).mean() > 0.2):
        fondo |= zona
# Recuperar el anillo que tapó el contorno engrosado, solo donde sigue siendo gris de fondo
fondo |= ndimage.binary_dilation(fondo, iterations=4) & (sat < 22) & (mn > 175)
# Abajo: la sombra del piso mezclada con el cuadriculado
filas = np.where((~fondo).any(1))[0]
piso = int(filas.max() - (filas.max() - filas.min()) * 0.07)
sombra = (sat < 26) & (mn > 135)
sombra[:piso] = False
fondo |= sombra
fondo = ndimage.binary_opening(fondo, iterations=1, border_value=1)

fig = ~fondo
lab2, n2 = ndimage.label(fig)
tam = ndimage.sum(fig, lab2, range(1, n2 + 1))
fig = np.isin(lab2, [i + 1 for i, t in enumerate(tam) if t > 3000])
alpha = Image.fromarray(np.where(fig, 255, 0).astype(np.uint8))
bb = alpha.getbbox()
im = Image.open(ruta).convert('RGB')
im.putalpha(alpha.filter(ImageFilter.GaussianBlur(1)))
im = im.crop(bb)
w, h = im.size
cuerpo = im.copy()
cuerpo.thumbnail((400, 400), Image.LANCZOS)
cuerpo.quantize(colors=200, method=Image.Quantize.FASTOCTREE).save(f'{destino}/{nombre}-cuerpo.png', optimize=True)
# Avatar: un cuadrado arriba, centrado en la cabeza
lado = min(w, int(h * 0.5))
arriba = np.asarray(im.split()[3])[: int(h * 0.15)]
cols = np.where(arriba.max(0) > 0)[0]
cx = int((cols.min() + cols.max()) / 2) if len(cols) else w // 2
cx = max(lado // 2, min(w - lado // 2, cx))
av = im.crop((cx - lado // 2, 0, cx - lado // 2 + lado, lado)).resize((192, 192), Image.LANCZOS)
av.quantize(colors=200, method=Image.Quantize.FASTOCTREE).save(f'{destino}/{nombre}.png', optimize=True)
print(nombre, 'listo', bb)
