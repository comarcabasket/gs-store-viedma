import {ico} from './icons.js';
import {$,$$,escapeHTML,categories,linkWhatsApp,normalizePhone,getCTA,productMessage,fetchJSON,toast} from './shared.js';
let site={},allProducts=[],activeCategory='todos',searchQuery='',currentDetailId='',currentPhotoIndex=0;
let catalogSort='default';
const validCategories=new Set(['todos','iphone','accesorios','importados']);
const catalogDetails={
 todos:{eyebrow:'/ 01 — CATÁLOGO',title:'Descubrí nuestra <span class="soft-text">selección.</span>',description:'Consultá disponibilidad y detalles de cada producto directamente con nosotros.'},
 iphone:{eyebrow:'/ 01 — IPHONE',title:'Encontrá tu <span class="soft-text">próximo iPhone.</span>',description:'Explorá los equipos disponibles y consultanos por precio y características.'},
 importados:{eyebrow:'/ 01 — IMPORTADOS',title:'Traemos lo que <span class="soft-text">estás buscando.</span>',description:'Productos a pedido y tecnología seleccionada. Consultanos por disponibilidad.'},
 accesorios:{eyebrow:'/ 01 — ACCESORIOS',title:'Los detalles <span class="soft-text">hacen la diferencia.</span>',description:'Fundas, cargadores, auriculares y accesorios para acompañar tu iPhone.'}
};
function closeMobileNav(){
 $('#navLinks').classList.remove('open');$('#menuToggle').setAttribute('aria-expanded','false');$('#menuToggle').setAttribute('aria-label','Abrir menú de navegación');$('#menuToggle').querySelector('.menu-label').textContent='Menú';
 closeCatalogDropdown();
}
function closeCatalogDropdown(){
 $('#catalogDropdown').classList.remove('open');$('#catalogDropdownToggle').setAttribute('aria-expanded','false');
}
function getRoute(){
 let hash='';try{hash=decodeURIComponent(location.hash.slice(1)).toLowerCase().replace(/\/$/,'');}catch{return {page:'inicio'};}
 if(hash==='canje'&&site.planCanjeActive!==false)return {page:'canje'};
 if(hash==='contacto')return {page:'contacto'};
 if(hash==='catalogo')return {page:'catalogo',category:'todos'};
 const productMatch=/^producto\/([a-z0-9_-]+)$/.exec(hash);
 if(productMatch)return {page:'producto',id:productMatch[1]};
 const match=/^catalogo\/(iphone|importados|accesorios)$/.exec(hash);
 if(match)return {page:'catalogo',category:match[1]};
 return {page:'inicio'};
}
function showRoute(){
 const route=getRoute();
 $$('.page-view').forEach(view=>{view.hidden=view.dataset.page!==route.page;});
 $$('.nav-page-link').forEach(link=>{
   const selected=link.getAttribute('href')==='#'+route.page;
   link.classList.toggle('is-active',selected);
   if(selected)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
 });
 const catalogActive=route.page==='catalogo'||route.page==='producto';
 $('#catalogDropdownToggle').classList.toggle('is-active',catalogActive);
 $$('#catalogDropdownMenu a').forEach(link=>{
   const selected=route.page==='catalogo'&&link.dataset.catalogMenu===(route.category||'todos');
   link.classList.toggle('is-active',selected);
   if(selected)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
 });
 if(catalogActive){
   const category=validCategories.has(route.category)?route.category:'todos';
   if(activeCategory!==category)setCategory(category);
   const details=catalogDetails[category];
   $('#catalogEyebrow').textContent=details.eyebrow;
   $('#catalogHeading').innerHTML=details.title;
   $('#catalogDescription').textContent=details.description;
 }
 if(route.page==='producto')renderProductDetail(route.id);
 closeMobileNav();
 document.title=route.page==='producto'?`${allProducts.find(p=>p.id===route.id&&p.published!==false)?.name||'Producto'} | GS Store Viedma`:route.page==='catalogo'?`${route.category==='todos'?'Catálogo':categories[route.category]} | GS Store Viedma`:route.page==='canje'?'Plan canje | GS Store Viedma':route.page==='contacto'?'Contacto | GS Store Viedma':'GS Store Viedma — Tu próximo iPhone empieza acá';
 window.scrollTo(0,0);
}

const logo='https://i.ibb.co/Q7RyKNvF/Chat-GPT-Image-29-ago-2026-06-11-09-p-m.png';
function icons(){ $$('[data-icon]').forEach(el=>{el.innerHTML=ico(el.dataset.icon);}); }
function renderSite(){
 $('#announcement').textContent=site.announcement||'Catálogo de tecnología · Consultas personalizadas';
 $('#heroTitle').textContent='';const title=site.heroTitle||'Tu próximo iPhone empieza acá.'; const marker=title.lastIndexOf(' ');const plain=marker>0?title.slice(0,marker):title;const accent=marker>0?title.slice(marker+1):''; $('#heroTitle').innerHTML=`${escapeHTML(plain)} <em>${escapeHTML(accent)}</em>`;
 $('#heroDescription').textContent=site.heroDescription||'';
 const number=normalizePhone(site.whatsappNumber);const wa=linkWhatsApp(number,'¡Hola, GS Store! 👋 Quisiera hacer una consulta.');
 const contact=$('#contactWhatsapp');const nav=$('#navWhatsapp');
 if(wa){contact.href=wa;contact.target='_blank';contact.rel='noopener noreferrer';nav.href=wa;nav.target='_blank';nav.rel='noopener noreferrer';}
 else{contact.href='#contacto';nav.href='#contacto';}
 $('#contactWhatsappDetail').textContent=number?`+${number}`:'Canal a configurar';
 let ig=String(site.instagramUrl||'').trim();if(/^https:\/\/(www\.)?(instagram\.com|instagr\.am)\//i.test(ig)){$('#contactInstagram').href=ig;$('#contactInstagram').target='_blank';$('#contactInstagram').rel='noopener noreferrer';}
 $('#contactInstagramDetail').textContent=site.instagramHandle||'Canal a configurar';
 $('#year').textContent=new Date().getFullYear();
 if(site.planCanjeActive===false){$$('a[href="#canje"]').forEach(a=>a.style.display='none');}
}
function setCategory(next){activeCategory=next;$$('.tab').forEach(t=>{const selected=t.dataset.category===next;t.classList.toggle('active',selected);t.setAttribute('aria-selected',selected?'true':'false');});renderProducts();}
function getProductImages(p){
 const images=Array.isArray(p.images)?p.images.filter(s=>typeof s==='string'&&(/^(https?:\/\/|\/media\/)/).test(s)):[];
 const original=typeof p.imageUrl==='string'&&p.imageUrl?p.imageUrl:'';
 if(!images.length&&original)return [original];
 if(original&&!images.includes(original))images.unshift(original);
 return images.slice(0,8);
}
function normalizeSearch(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es-AR').trim();}
function renderProducts(){
 const published=allProducts.filter(p=>p.published!==false);
 const terms=normalizeSearch(searchQuery).split(/\s+/).filter(Boolean);
 const items=published.filter(p=>{
   if(activeCategory!=='todos'&&p.category!==activeCategory)return false;
   const haystack=normalizeSearch([p.name,p.subtitle,p.description,p.badge,(p.features||[]).join(' '),categories[p.category]].join(' '));
   return terms.every(term=>haystack.includes(term));
 });
 if(catalogSort==='az'||catalogSort==='za')items.sort((a,b)=>catalogSort==='az'?a.name.localeCompare(b.name,'es',{numeric:true}):b.name.localeCompare(a.name,'es',{numeric:true}));
 $('#catalogCount').textContent=items.length===1?'1 producto':`${items.length} productos`;
 $('#clearCatalogSearch').hidden=!terms.length;
 if(!items.length){
  const noProducts=published.length===0;
  const noCategoryProducts=!noProducts&&!terms.length&&activeCategory!=='todos';
  const heading=noProducts?'Estamos preparando nuestro catálogo.':noCategoryProducts?'Pronto habrá novedades en esta categoría.':'No encontramos coincidencias.';
  const message=noProducts?'Mientras tanto, podés consultarnos por WhatsApp.':noCategoryProducts?'Podés explorar las otras categorías o consultarnos por disponibilidad.':'Probá con otra palabra o limpiá la búsqueda.';
  const target=noProducts?'#contacto':'#catalogo';
  const button=noProducts?'Hacer una consulta':'Ver todo el catálogo';
  $('#productGrid').innerHTML=`<div class="empty-state"><div class="empty-icon">${ico(noProducts||noCategoryProducts?'bag':'search',23)}</div><h3>${heading}</h3><p>${message}</p><a class="btn btn-primary" href="${target}">${button} ${ico('arrow',15)}</a></div>`;
  return;
 }
 $('#productGrid').innerHTML=items.map(p=>{
  const image=getProductImages(p)[0];const photos=getProductImages(p).length;
  return `<a href="#producto/${encodeURIComponent(p.id)}" class="product-card" aria-label="Ver ${escapeHTML(p.name)}: fotos, características y consulta"><div class="product-image">${image?`<img loading="lazy" decoding="async" src="${escapeHTML(image)}" alt="${escapeHTML(p.name)}"/>`:`<div class="product-fallback">GS</div>`}${p.badge?`<span class="product-badge">${escapeHTML(p.badge)}</span>`:''}${photos>1?`<span class="photo-count">${ico('image',13)} ${photos} fotos</span>`:''}</div><div class="product-body"><div class="product-category">${escapeHTML(categories[p.category]||p.category)}</div><h3>${escapeHTML(p.name)}</h3><p>${escapeHTML(p.subtitle||'')}</p></div><div class="product-card-cta"><span>${escapeHTML(getCTA(p))}</span>${ico('arrow',18)}</div></a>`;
 }).join('');
 // Si una foto externa deja de existir, mostrar un reemplazo visual limpio.
 $$('#productGrid .product-image img').forEach(img=>img.addEventListener('error',()=>{
   const placeholder=document.createElement('div');placeholder.className='product-fallback';placeholder.textContent='GS';
   img.replaceWith(placeholder);
 },{once:true}));
}
async function shareCurrentProduct(){
 const p=allProducts.find(item=>item.id===currentDetailId&&item.published!==false);
 if(!p)return;
 const url=location.origin+location.pathname+'#producto/'+encodeURIComponent(p.id);
 const title=p.name+' | GS Store Viedma';
 if(navigator.share){
   try{await navigator.share({title,text:'Mirá este producto de GS Store Viedma',url});return;}
   catch(error){if(error?.name==='AbortError')return;}
 }
 try{await navigator.clipboard.writeText(url);toast('Enlace del producto copiado.');}
 catch{toast('No fue posible copiar el enlace automáticamente.');}
}
function renderProductDetail(id){
 const p=allProducts.find(p=>p.id===id&&p.published!==false);
 if(!p){
  $('#detailShare').hidden=true;
  currentDetailId='';$('#detailTitle').textContent='Producto no disponible';$('#detailCategory').textContent='/ CATÁLOGO';$('#detailSubtitle').textContent='';$('#detailPrice').textContent='';$('#detailDescription').textContent='Este producto no está publicado o ya no forma parte del catálogo.';$('#detailSpecs').innerHTML='';$('#detailMainImage').innerHTML='<div class="product-fallback">GS</div>';$('#detailThumbnails').innerHTML='';$('#detailCTA').href='#catalogo';$('#detailCTA').textContent='Volver al catálogo';return;
 }
 $('#detailShare').hidden=false;
 if(currentDetailId!==id){currentPhotoIndex=0;currentDetailId=id;}
 $('#detailCategory').textContent=`/ ${categories[p.category]||'PRODUCTO'}`;
 $('#detailTitle').textContent=p.name;$('#detailSubtitle').textContent=p.subtitle||'';
 $('#detailPrice').textContent=getCTA(p);$('#detailDescription').textContent=p.description||'';
 $('#detailBack').href=p.category==='iphone'||p.category==='importados'||p.category==='accesorios'?`#catalogo/${p.category}`:'#catalogo';
 const features=Array.isArray(p.features)?p.features:[];
 $('#detailSpecs').innerHTML=features.filter(Boolean).map(f=>`<div>${ico('check',16)}<span>${escapeHTML(f.replace(/^[-•]\s*/,''))}</span></div>`).join('')||'<p>Consultanos por los detalles y variantes de este equipo.</p>';
 const cta=$('#detailCTA');const url=linkWhatsApp(site.whatsappNumber,productMessage(p));
 cta.href=url||'#contacto';cta.target=url?'_blank':'_self';cta.rel=url?'noopener noreferrer':'';
 cta.innerHTML=`${p.category==='importados'?'Consultar stock':p.category==='iphone'?'Consultar precio y disponibilidad':'Consultar por WhatsApp'} ${ico('northeast',17)}`;
 renderProductGallery(p);
}
function currentProduct(){return allProducts.find(p=>p.id===currentDetailId&&p.published!==false);}
function updateLightbox(){
 const dialog=$('#imageLightbox');if(!dialog.open)return;
 const product=currentProduct();const images=product?getProductImages(product):[];
 if(!images.length){dialog.close();return;}
 currentPhotoIndex=(currentPhotoIndex+images.length)%images.length;
 const image=$('#lightboxPhoto');
 image.src=images[currentPhotoIndex];
 image.alt=`${product.name} — fotografía ${currentPhotoIndex+1} de ${images.length}`;
 $('#lightboxTitle').textContent=product.name;
 $('#lightboxCount').textContent=`${currentPhotoIndex+1} de ${images.length}`;
 $('#lightboxPrev').hidden=images.length<2;
 $('#lightboxNext').hidden=images.length<2;
 $('#lightboxThumbnails').innerHTML=images.length>1?images.map((src,i)=>`<button type="button" class="lightbox-thumb ${i===currentPhotoIndex?'active':''}" data-lightbox-index="${i}" aria-label="Ver fotografía ${i+1}" aria-pressed="${i===currentPhotoIndex}"><img loading="lazy" src="${escapeHTML(src)}" alt=""/></button>`).join(''):'';
}
function openLightbox(){
 const product=currentProduct();if(!product||!getProductImages(product).length)return;
 const dialog=$('#imageLightbox');if(!dialog.open)dialog.showModal();
 updateLightbox();
}
function moveLightbox(direction){
 const product=currentProduct();if(!product)return;
 const images=getProductImages(product);if(images.length<2)return;
 currentPhotoIndex=(currentPhotoIndex+direction+images.length)%images.length;
 renderProductGallery(product);updateLightbox();
}
function renderProductGallery(p){
 const images=getProductImages(p);
 if(currentPhotoIndex>=images.length)currentPhotoIndex=0;
 const image=images[currentPhotoIndex];
 $('#detailMainImage').innerHTML=image?`${images.length>1?`<button type="button" class="gallery-arrow previous" data-gallery-step="-1" aria-label="Foto anterior">${ico('arrow',22)}</button>`:''}<img src="${escapeHTML(image)}" decoding="async" alt="${escapeHTML(p.name)} — fotografía ${currentPhotoIndex+1} de ${images.length}"/>${images.length>1?`<button type="button" class="gallery-arrow next" data-gallery-step="1" aria-label="Foto siguiente">${ico('arrow',22)}</button>`:''}<button type="button" class="gallery-enlarge" aria-label="Ampliar fotografía a pantalla completa">${ico('image',15)}<span>Ampliar foto</span></button><span class="gallery-position">${currentPhotoIndex+1} / ${images.length}</span>`:'<div class="product-fallback">GS</div>';
 const mainImage=$('#detailMainImage img');
 if(mainImage)mainImage.addEventListener('error',()=>{
   const fallback=document.createElement('div');fallback.className='product-fallback';fallback.textContent='Imagen no disponible';
   $('#detailMainImage').replaceChildren(fallback);
 },{once:true});
 $('#detailThumbnails').innerHTML=images.length>1?images.map((src,i)=>`<button type="button" class="gallery-thumb ${i===currentPhotoIndex?'active':''}" data-gallery-index="${i}" aria-label="Mostrar foto ${i+1}" aria-pressed="${i===currentPhotoIndex}"><img src="${escapeHTML(src)}" alt="" loading="lazy" decoding="async"/></button>`).join(''):'';
 $$('[data-gallery-index]').forEach(b=>b.addEventListener('click',()=>{currentPhotoIndex=Number(b.dataset.galleryIndex);renderProductGallery(p);}));
 $$('[data-gallery-step]').forEach(b=>b.addEventListener('click',()=>{currentPhotoIndex=(currentPhotoIndex+Number(b.dataset.galleryStep)+images.length)%images.length;renderProductGallery(p);}));
}
function makeTradeMessage(){const model=$('#tradeModel').value;const storage=$('#tradeStorage').value;const battery=$('#tradeBattery').value;const condition=$('#tradeCondition').value;const details=$('#tradeDetails').value.trim();const wanted=$('#tradeWanted').value.trim();return `¡Hola, GS Store! 👋 Quiero cotizar mi iPhone para el *plan canje*.\n\n📱 *Modelo:* ${model}\n💾 *Almacenamiento:* ${storage}\n🔋 *Salud de batería:* ${battery}%\n✨ *Estado general:* ${condition}\n🔎 *Detalles:* ${details||'No informados'}${wanted?`\n🛍️ *Me interesa:* ${wanted}`:''}\n\n¿Podrían ayudarme con una cotización? ¡Gracias!`;}
const eligibleTradeModels = [
 'iPhone 18 Pro Max','iPhone 18 Pro','iPhone 18','iPhone 17 Pro Max','iPhone 17 Pro','iPhone 17 Air','iPhone 17',
 'iPhone 16 Pro Max','iPhone 16 Pro','iPhone 16 Plus','iPhone 16','iPhone 16e',
 'iPhone 15 Pro Max','iPhone 15 Pro','iPhone 15 Plus','iPhone 15',
 'iPhone 14 Pro Max','iPhone 14 Pro','iPhone 14 Plus','iPhone 14',
 'iPhone 13 Pro Max','iPhone 13 Pro','iPhone 13 mini','iPhone 13',
 'iPhone 12 Pro Max','iPhone 12 Pro','iPhone 12 mini','iPhone 12',
 'iPhone 11 Pro Max','iPhone 11 Pro','iPhone 11'
];
function fillModels(){
 const model=$('#tradeModel');
 model.insertAdjacentHTML('beforeend',eligibleTradeModels.map(name=>`<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`).join(''));
}
function validTradeModel(){
 const model=$('#tradeModel');
 model.setCustomValidity(model.value&&!eligibleTradeModels.includes(model.value)?'El Plan Canje acepta iPhone 11 o posteriores. Seleccioná un modelo de la lista.':'');
 return model.checkValidity();
}

function setupEvents(){
 icons();fillModels();$('#tradeModel').addEventListener('change',validTradeModel);
 $('#homeCategoryJump').addEventListener('click',()=>$('#homeCategories').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'}));
 $$('.tab').forEach(b=>b.addEventListener('click',()=>{
   const category=b.dataset.category;
   const next=category==='todos'?'#catalogo':`#catalogo/${category}`;
   if(location.hash===next){setCategory(category);showRoute();}else location.hash=next;
 }));
 $('#catalogDropdownToggle').addEventListener('click',()=>{
   const dropdown=$('#catalogDropdown');const open=dropdown.classList.toggle('open');
   $('#catalogDropdownToggle').setAttribute('aria-expanded',String(open));
 });
 document.addEventListener('click',event=>{if(!$('#catalogDropdown').contains(event.target))closeCatalogDropdown();});
 document.addEventListener('keydown',event=>{if(event.key==='Escape')closeCatalogDropdown();});
 window.addEventListener('hashchange',()=>{if($('#imageLightbox').open)$('#imageLightbox').close();showRoute();});
 $('#productSearch').addEventListener('input',e=>{searchQuery=e.target.value;renderProducts();});
 $('#clearCatalogSearch').addEventListener('click',()=>{searchQuery='';$('#productSearch').value='';renderProducts();$('#productSearch').focus();});
 $('#catalogSort').addEventListener('change',e=>{catalogSort=e.target.value;renderProducts();});
 $('#detailShare').addEventListener('click',shareCurrentProduct);
 $('#menuToggle').addEventListener('click',()=>{
   const open=$('#navLinks').classList.toggle('open');
   $('#menuToggle').setAttribute('aria-expanded',String(open));
   $('#menuToggle').setAttribute('aria-label',open?'Cerrar menú de navegación':'Abrir menú de navegación');
   $('#menuToggle').querySelector('.menu-label').textContent=open?'Cerrar':'Menú';
   if(!open)closeCatalogDropdown();
 });
 document.addEventListener('click',event=>{
   if($('#navLinks').classList.contains('open')&&!$('#header').contains(event.target))closeMobileNav();
 });
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('#navLinks').classList.contains('open'))closeMobileNav();});
 window.addEventListener('resize',()=>{if(window.innerWidth>800&&$('#navLinks').classList.contains('open'))closeMobileNav();});
 $$('.nav-links a').forEach(a=>a.addEventListener('click',()=>closeMobileNav()));
 $('#detailMainImage').addEventListener('click',event=>{
  if(event.target.closest('[data-gallery-step]'))return;
  if(event.target.closest('img,.gallery-enlarge'))openLightbox();
 });
 $('#lightboxClose').addEventListener('click',()=>$('#imageLightbox').close());
 $('#imageLightbox').addEventListener('click',event=>{if(event.target===$('#imageLightbox'))$('#imageLightbox').close();});
 $('#lightboxPrev').addEventListener('click',()=>moveLightbox(-1));
 $('#lightboxNext').addEventListener('click',()=>moveLightbox(1));
 $('#lightboxThumbnails').addEventListener('click',event=>{
  const button=event.target.closest('[data-lightbox-index]');if(!button)return;
  const product=currentProduct();if(!product)return;
  currentPhotoIndex=Number(button.dataset.lightboxIndex);
  renderProductGallery(product);updateLightbox();
 });
 $('#imageLightbox').addEventListener('keydown',event=>{
  if(event.key==='ArrowLeft'||event.key==='ArrowRight'){
   event.preventDefault();moveLightbox(event.key==='ArrowLeft'?-1:1);
  }
 });
 let lightboxTouch=null;
 $('#lightboxStage').addEventListener('touchstart',event=>{
  const touch=event.changedTouches[0];if(touch)lightboxTouch={x:touch.clientX,y:touch.clientY};
 },{passive:true});
 $('#lightboxStage').addEventListener('touchend',event=>{
  if(!lightboxTouch)return;
  const touch=event.changedTouches[0];if(!touch)return;
  const dx=touch.clientX-lightboxTouch.x,dy=touch.clientY-lightboxTouch.y;
  lightboxTouch=null;
  if(Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.2)moveLightbox(dx<0?1:-1);
 },{passive:true});
 $('#detailMainImage').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;const p=allProducts.find(p=>p.id===currentDetailId);const photos=p?getProductImages(p):[];if(photos.length<2)return;e.preventDefault();currentPhotoIndex=(currentPhotoIndex+(e.key==='ArrowRight'?1:-1)+photos.length)%photos.length;renderProductGallery(p);});
 $('#tradeForm').addEventListener('submit',e=>{e.preventDefault();validTradeModel();if(!e.target.reportValidity())return;const url=linkWhatsApp(site.whatsappNumber,makeTradeMessage());if(!url){$('#tradeStatus').textContent='El número de WhatsApp todavía no está configurado. Podés copiar el mensaje y enviarlo por otro medio.';return;}$('#tradeStatus').textContent='Se abrió WhatsApp. Revisá el mensaje y presioná enviar.';window.open(url,'_blank','noopener,noreferrer');});
 $('#copyTrade').addEventListener('click',async()=>{validTradeModel();if(!$('#tradeForm').reportValidity())return;try{await navigator.clipboard.writeText(makeTradeMessage());toast('Mensaje copiado.');}catch{toast('No se pudo copiar automáticamente.');}});
}
async function init(){setupEvents();const [siteResult,productResult]=await Promise.all([fetchJSON('/api/content?type=site',{}),fetchJSON('/api/content?type=products',[])]);site=siteResult&&typeof siteResult==='object'&&!Array.isArray(siteResult)?siteResult:{};allProducts=Array.isArray(productResult)?productResult:[];renderSite();renderProducts();showRoute();}
init();
