# máquinashonestas

Blog estático de noticias (IA · tecnología · mundo) para GitHub Pages.

## Archivos

| Archivo | Qué es |
|---|---|
| `index.html` | La página. Carga las noticias desde `posts.json` y genera el JSON-LD para Google. |
| `posts.json` | **La base de datos.** Es lo único que tocas (o toca tu API) para publicar. |
| `robots.txt` | Permite indexar todo y apunta al sitemap. |
| `sitemap.xml` | Mapa del sitio para Google. `publicar.js` lo regenera solo. |
| `publicar.js` | Script para publicar una noticia por la API de GitHub con tu token. |
| `noticia-ejemplo.json` | Plantilla de noticia con la estructura exacta. |

## Publicar en GitHub Pages
1. Crea el repo (p. ej. `maquinashonestas`) y sube todos los archivos a la raíz.
2. **Settings → Pages → Deploy from a branch → main / (root)**.
3. Sustituye `TUUSUARIO` por tu usuario real en `index.html` (canonical + og:url), `robots.txt` y `sitemap.xml`.
4. Da de alta la web en [Google Search Console](https://search.google.com/search-console) y envía el sitemap. Con eso Google la rastrea.

## Estructura de un post (contrato de la API)

Tu API debe enviar exactamente esto:

```json
{
  "id": "slug-unico-sin-espacios",
  "titulo": "Titular de la noticia",
  "fecha": "2026-07-21",
  "resumen": "Una o dos frases.",
  "cuerpo": ["Párrafo 1.", "Párrafo 2."],
  "etiquetas": ["ia", "tecnología"]
}
```

Reglas: `id` en minúsculas con guiones (será la URL `.../#slug`), `fecha` en `AAAA-MM-DD`,
`cuerpo` es un array de párrafos, `etiquetas` mínimo una. La web ordena por fecha
(más reciente arriba) y las píldoras de arriba se eligen al azar entre todas las
etiquetas existentes en cada carga.

## Publicar con el token (API de GitHub)

```bash
export GH_TOKEN="ghp_tu_token"                  # permiso: Contents (read/write)
export GH_REPO="TUUSUARIO/maquinashonestas"
node publicar.js noticia-ejemplo.json
```

El script valida la estructura, añade la noticia arriba de `posts.json`,
regenera `sitemap.xml` con todas las URLs y hace los dos commits por API.
GitHub Pages se redespliega solo en ~1 minuto.

También puedes hacerlo a mano: edita `posts.json` desde github.com y pega
el objeto nuevo al principio del array `posts`.

## SEO — qué lleva
- Meta description, keywords, canonical, Open Graph y Twitter card.
- `robots.txt` + `sitemap.xml` (regenerado en cada publicación).
- JSON-LD `schema.org/Blog` + `BlogPosting` generado con todos los posts
  (titular, fecha, resumen, cuerpo completo, etiquetas y URL propia).
- Texto completo de cada artículo presente en el DOM aunque esté plegado.
- Cada noticia tiene URL propia (`.../#slug`): al abrirla se actualiza la URL
  y puedes compartir el enlace directo, que abre esa noticia al cargar.

## Nota
En local, `fetch('posts.json')` no funciona abriendo el archivo a pelo (`file://`).
Sirve la carpeta con `python3 -m http.server` o `npx serve` para probarla.
