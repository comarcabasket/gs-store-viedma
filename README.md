# GS Store Viedma — Catálogo digital

Web responsiva para **GS Store Viedma**. No tiene carrito, pagos ni checkout: presenta productos y facilita las consultas por WhatsApp.

## Qué incluye

- Portada moderna con el **logo exacto** indicado para la marca.
- Tres secciones: **iPhone** (de entrada, «Consultá precio»), **Importados** («Consultá stock») y **Accesorios** (precio real).
- Catálogo con búsqueda, filtros, fichas de producto, características y fotografías.
- **Plan canje**: modelo, almacenamiento, batería, estado, observaciones y modelo deseado; prepara un WhatsApp completo, sin enviar datos automáticamente.
- Contacto con links a WhatsApp e Instagram.
- **Panel de administración privado**: `/admin.html` para crear, editar, despublicar y eliminar productos, además de cambiar los contactos y textos del sitio.
- Persistencia real de los cambios mediante **commits a GitHub** usando funciones serverless de Vercel.
- Subida directa de fotos desde el panel (JPG/PNG/WebP; se optimizan en el navegador y se almacenan en el repositorio).

**Importante:** el catálogo viene vacío deliberadamente; no se muestran productos ni existencias inventadas. Tampoco se configuró un WhatsApp ni Instagram sin conocer los datos oficiales.

## Publicarlo en GitHub + Vercel

### 1. Crear repositorio

1. En GitHub, elegí **New repository** y creá, por ejemplo, `gs-store-viedma`.
2. Subí **todos los archivos y carpetas de este proyecto** a la raíz del repositorio. No subas el `.zip` directamente: hay que descomprimirlo antes.
3. Usá rama `main`.

### 2. Crear token seguro para editar desde el panel

En GitHub: **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.

- Seleccioná **solo el repositorio GS Store Viedma**.
- Permiso: **Repository permissions → Contents: Read and write**.
- Copiá el token. No lo publiques y nunca lo incluyas en un archivo del repositorio.

### 3. Importarlo a Vercel

1. En Vercel, **Add New → Project**.
2. Importá `gs-store-viedma` desde GitHub.
3. **Framework Preset: Other**; carpeta raíz: `./`; no necesita comando de instalación ni compilación.
4. En **Environment Variables**, agregá lo siguiente:

   - `ADMIN_PASSWORD`: contraseña privada, larga y robusta para `/admin.html`.
   - `SESSION_SECRET`: otra cadena aleatoria distinta y larga (idealmente 32+ caracteres).
   - `GITHUB_TOKEN`: token Fine-grained creado en el paso anterior.
   - `GITHUB_REPO`: `usuario/gs-store-viedma` (reemplazá `usuario` por el dueño real del repositorio).
   - `GITHUB_BRANCH`: `main` (opcional: es el valor por defecto).

5. Desplegá el sitio y verificá que las variables se aplican a **Production**.

**Consejo:** no compartas la contraseña ni el token en este chat o en capturas públicas. Solo se introducen en Vercel.

### 4. Personalizar

1. Visitá `https://TU-SITIO.vercel.app/admin.html` e ingresá tu `ADMIN_PASSWORD`.
2. Abrí **Datos del sitio** para configurar WhatsApp en formato internacional **sin `+`** (Argentina suele usar `549` + número con área), URL y usuario de Instagram.
3. Abrí **Productos**, elegí **Nuevo producto**, completá ficha, imagen y características.
4. Usá **Aplicar cambios** y luego **Guardar catálogo en GitHub**. La edición de textos generales se guarda con su propio botón.
5. Cada guardado crea un commit nuevo, por lo que el sitio se actualiza y Vercel vuelve a desplegar automáticamente. El sitio también consulta la versión actual de los contenidos guardados en GitHub.

### Productos y precios

- iPhone: `showPrice: false` significa **«Consultá precio»** aunque hayas guardado un importe. Si activás “Mostrar precio”, aparece el valor cargado.
- Importados: siempre **«Consultá stock»**.
- Accesorios: muestra el importe cargado en ARS o USD. Si no hay, muestra **«Consultanos»**.
- **Publicado:** sólo los productos marcados se muestran en el sitio público.
- **Foto:** subila desde tu computadora directamente con el botón del panel (se optimiza y guarda en GitHub) o pegá la URL pública de la imagen. Es recomendable que sea una fotografía real del producto.

### Respaldo

Desde el panel podés descargar un `.json` del catálogo. También queda un historial de versiones en los commits de GitHub.

## Vista previa local

Requiere Node.js 20+. En esta carpeta ejecutá:

```bash
npm run dev
```

Luego abrí `http://localhost:3000`. La vista previa muestra el catálogo, el diseño y el formulario. El panel solo puede acceder al modo de edición persistente cuando están configuradas las variables de entorno y un repositorio real en GitHub.

## Seguridad y mantenimiento

- El token de GitHub y la contraseña residen en variables privadas del servidor en Vercel; no se envían al navegador.
- La sesión usa cookie firmada HttpOnly y SameSite=Strict; se valida el origen de solicitudes que escriben.
- La limitación de intentos es básica por instancia serverless; para un uso masivo conviene sumar protección de acceso o limitación global.
- Si el token caduca, se deberá renovarlo en Vercel.
- Las fotos del catálogo pueden estar en servidores externos. Si se eliminan allí, no aparecerán en la web.
- El logo enlaza al archivo original que proporcionaste en i.ibb.co, sin modificarlo; conviene mantener ese link operativo.
