#!/usr/bin/env node
/* ============================================================
   máquinashonestas — publicar.js
   Publica una noticia nueva por la API de GitHub usando tu token.
   Actualiza posts.json Y regenera sitemap.xml en el mismo push.

   Uso:
     export GH_TOKEN="ghp_xxx"          # tu token (permiso: repo/contents)
     export GH_REPO="TUUSUARIO/maquinashonestas"
     node publicar.js noticia.json

   noticia.json (estructura obligatoria):
   {
     "id":        "slug-unico-sin-espacios",
     "titulo":    "Titular de la noticia",
     "fecha":     "2026-07-21",
     "resumen":   "Una o dos frases de resumen.",
     "cuerpo":    ["Párrafo 1.", "Párrafo 2.", "Párrafo 3."],
     "etiquetas": ["ia", "tecnología"]
   }
   ============================================================ */

const fs = require('fs');

const TOKEN = process.env.GH_TOKEN;
const REPO  = process.env.GH_REPO;                       // "usuario/repo"
if (!TOKEN || !REPO){
  console.error('Faltan variables: GH_TOKEN y GH_REPO');
  process.exit(1);
}
const archivo = process.argv[2];
if (!archivo){
  console.error('Uso: node publicar.js noticia.json');
  process.exit(1);
}

const API  = `https://api.github.com/repos/${REPO}/contents`;
const HEAD = {
  'Authorization': `Bearer ${TOKEN}`,
  'Accept': 'application/vnd.github+json',
  'User-Agent': 'maquinashonestas-publisher'
};
const b64encode = s => Buffer.from(s, 'utf8').toString('base64');
const b64decode = s => Buffer.from(s, 'base64').toString('utf8');

/* --- validación estricta del post --- */
function validar(p){
  const errores = [];
  if (!/^[a-z0-9-]+$/.test(p.id || ''))            errores.push('id: solo minúsculas, números y guiones');
  if (!p.titulo)                                    errores.push('titulo: obligatorio');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.fecha || ''))  errores.push('fecha: formato AAAA-MM-DD');
  if (!p.resumen)                                   errores.push('resumen: obligatorio');
  if (!Array.isArray(p.cuerpo) || !p.cuerpo.length) errores.push('cuerpo: array de párrafos, mínimo 1');
  if (!Array.isArray(p.etiquetas) || !p.etiquetas.length) errores.push('etiquetas: array, mínimo 1');
  return errores;
}

async function getFile(path){
  const res = await fetch(`${API}/${path}`, { headers: HEAD });
  if (!res.ok) throw new Error(`GET ${path}: ${res.status}`);
  return res.json();
}
async function putFile(path, contenido, mensaje, sha){
  const res = await fetch(`${API}/${path}`, {
    method: 'PUT',
    headers: { ...HEAD, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: mensaje, content: b64encode(contenido), sha })
  });
  if (!res.ok) throw new Error(`PUT ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

function generarSitemap(posts, baseUrl){
  const hoy = new Date().toISOString().slice(0, 10);
  const urls = [
    `  <url>\n    <loc>${baseUrl}</loc>\n    <lastmod>${hoy}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>`,
    ...posts.map(p =>
    `  <url>\n    <loc>${baseUrl}#${p.id}</loc>\n    <lastmod>${p.fecha}</lastmod>\n  </url>`)
  ].join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

(async () => {
  /* 1. lee y valida la noticia nueva */
  const post = JSON.parse(fs.readFileSync(archivo, 'utf8'));
  const errores = validar(post);
  if (errores.length){
    console.error('Estructura incorrecta:\n - ' + errores.join('\n - '));
    process.exit(1);
  }

  /* 2. descarga posts.json actual */
  const remoto = await getFile('posts.json');
  const data = JSON.parse(b64decode(remoto.content));

  if (data.posts.some(p => p.id === post.id)){
    console.error(`Ya existe un post con id "${post.id}".`);
    process.exit(1);
  }

  /* 3. añade el post arriba y actualiza la fecha del sitio */
  data.posts.unshift(post);
  data.actualizado = new Date().toISOString().slice(0, 10);
  const nuevoJson = JSON.stringify(data, null, 2) + '\n';

  /* 4. regenera el sitemap con todos los posts */
  const [usuario, repoNombre] = REPO.split('/');
  const baseUrl = `https://${usuario}.github.io/${repoNombre}/`;
  const sitemap = generarSitemap(data.posts, baseUrl);
  const sitemapRemoto = await getFile('sitemap.xml');

  /* 5. sube los dos archivos */
  await putFile('posts.json', nuevoJson, `noticia: ${post.titulo}`, remoto.sha);
  await putFile('sitemap.xml', sitemap, `sitemap: ${post.id}`, sitemapRemoto.sha);

  console.log(`Publicado ✓  ${post.titulo}`);
  console.log(`URL: ${baseUrl}#${post.id}`);
})().catch(err => { console.error(err.message); process.exit(1); });
