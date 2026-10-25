// Vista previa local sin dependencias. No guarda cambios en producción: usá Vercel + GitHub.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ROOT=process.cwd(),PORT=Number(process.env.PORT||3000);
const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
const handlerLogin=require('./api/login.js'),handlerContent=require('./api/content.js'),handlerUpload=require('./api/upload.js');
http.createServer(async(req,res)=>{try{
 const u=new URL(req.url,'http://localhost');if(u.pathname==='/api/login'){req.query=Object.fromEntries(u.searchParams);return await handlerLogin(req,res);}if(u.pathname==='/api/content'){req.query=Object.fromEntries(u.searchParams);return await handlerContent(req,res);}if(u.pathname==='/api/upload'){return await handlerUpload(req,res);}
 const filepath=path.join(ROOT,decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));if(!filepath.startsWith(ROOT+path.sep))throw Error('Acceso no permitido');const stats=await fs.stat(filepath);if(stats.isDirectory())throw Error('No se puede mostrar carpeta');const buffer=await fs.readFile(filepath);res.setHeader('Content-Type',types[path.extname(filepath)]||'application/octet-stream');res.end(buffer);
 }catch{res.statusCode=404;res.end('No encontrado');}}).listen(PORT,()=>console.log(`GS Store preview en http://localhost:${PORT}`));
