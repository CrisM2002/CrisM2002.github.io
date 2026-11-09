// Esperar a que TODO el HTML esté dibujado antes de buscar los botones
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        // Si no hay token guardado, lo mandamos al login y detenemos todo
        window.location.href = 'login.html';
        return;
    }
    
    // 1. Cargar las publicaciones del muro
    if (typeof cargarPublicaciones === 'function') {
        cargarPublicaciones();
    }

    // 2. Lógica para Cerrar Sesión
    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = 'login.html';
        });
    }

    // 3. Lógica del Botón de la Tienda
    const btnNavProductos = document.getElementById('btnNavProductos');
    console.log("¿Encontró el botón en el HTML?:", btnNavProductos); // <-- Esto te dirá la verdad en la consola

    let usuarioSesion = {};
    try { 
        usuarioSesion = JSON.parse(localStorage.getItem('usuario')) || {}; 
    } catch (e) { }

    const rolDelUsuario = usuarioSesion.Rol || usuarioSesion.rol;

    if (btnNavProductos && rolDelUsuario) {
        const rolActual = String(rolDelUsuario).toLowerCase();
        
        if (rolActual.includes('vendedor') || rolActual.includes('admin')) {
            btnNavProductos.classList.remove('d-none');
            btnNavProductos.classList.add('d-inline-block');
        }

        // --- NUEVO: Mostrar el botón rojo solo al Administrador ---
        const btnNavAdmin = document.getElementById('btnNavAdmin');
        if (btnNavAdmin && rolActual.includes('admin')) {
            btnNavAdmin.classList.remove('d-none');
            btnNavAdmin.classList.add('d-inline-block');
        }
        // ----------------------------------------------------------
    }
});

// Descarga los datos de la base de datos UNA vez
async function cargarPublicaciones() {
    const contenedor = document.getElementById('contenedorPublicaciones');
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="text-center w-100">
            <div class="spinner-border text-primary" role="status"></div>
            <p id="msgCarga" class="text-muted small mt-2"></p>
        </div>`;

    // Si tarda más de 5 s, probablemente el servidor de Render estaba dormido
    const avisoLento = setTimeout(() => {
        const msg = document.getElementById('msgCarga');
        if (msg) msg.innerText = 'El servidor está despertando, esto puede tardar hasta un minuto...';
    }, 5000);

    const respuesta = await obtenerPublicaciones();
    clearTimeout(avisoLento);

    if (respuesta.status === 200) {
        window.publicacionesCargadas = respuesta.data.data || [];
        dibujarPublicaciones(window.publicacionesCargadas);
        return;
    }

    // Sesión vencida o token inválido: limpiar y mandar al login
    if (respuesta.status === 401 || respuesta.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        alert('Tu sesión expiró. Por favor inicia sesión de nuevo.');
        window.location.href = 'login.html';
        return;
    }

    console.error('Error al cargar publicaciones:', respuesta);
    contenedor.innerHTML = `
        <div class="text-center w-100">
            <p class="text-danger">Error al conectar con el servidor.</p>
            <button class="btn btn-primary btn-sm rounded-pill px-4" onclick="cargarPublicaciones()">Reintentar</button>
        </div>`;
}

// Toma una lista de publicaciones y las dibuja en el HTML
function dibujarPublicaciones(listaPublicaciones) {
    const contenedor = document.getElementById('contenedorPublicaciones');
    contenedor.innerHTML = ''; // Limpiamos el muro

    if (listaPublicaciones.length === 0) {
        contenedor.innerHTML = '<p class="text-center w-100 text-muted py-5">No se encontraron resultados para tu búsqueda. 🕵️‍♂️</p>';
        return;
    }

    // Recuperamos los datos del usuario para los permisos
    let usuarioSesion = {};
    try {
        const storedUser = localStorage.getItem('usuario');
        if (storedUser) usuarioSesion = JSON.parse(storedUser);
    } catch (e) { }

    // Aquí pegamos toda la lógica que ya tenías para dibujar la tarjeta
    listaPublicaciones.forEach(pub => {
        const nombreAutorLimpio = escaparHTML(pub.nombre_usuario || 'Usuario');
        const inicialAutor = escaparHTML((pub.nombre_usuario || "U").charAt(0).toUpperCase());
        const fotoUsuarioLimpia = pub.foto_usuario ? escaparHTML(pub.foto_usuario) : '';

        const avatarHTML = fotoUsuarioLimpia 
            ? `<img src="${fotoUsuarioLimpia}" class="rounded-circle me-2 shadow-sm" style="width: 40px; height: 40px; object-fit: cover;">`
            : `<div class="bg-primary rounded-circle text-white d-flex justify-content-center align-items-center me-2 shadow-sm" style="width: 40px; height: 40px; font-weight: bold;">
                  ${inicialAutor}
               </div>`;

        const urlImagenLimpia = pub.Imagen ? escaparHTML(pub.Imagen) : '';
        const imagenHTML = urlImagenLimpia ? `
            <div class="position-relative overflow-hidden bg-black" style="cursor: pointer; height: 400px;" onclick="verImagenGrande('${urlImagenLimpia}')">
                <img src="${urlImagenLimpia}" class="position-absolute h-100 w-100" style="object-fit: cover; filter: blur(15px); opacity: 0.5; top:0; left:0;">
                <img src="${urlImagenLimpia}" class="position-relative h-100 w-100" style="object-fit: contain; z-index: 2;">
            </div>
        ` : '';

        const idPubLimpio = escaparHTML(pub.Id_Publicacion);
        const esDueno = usuarioSesion.id && String(pub.Id_Usuario) === String(usuarioSesion.id);
        const rolSesion = String(usuarioSesion.Rol || usuarioSesion.rol || '').toLowerCase();
        const esAdmin = rolSesion === 'admin';

        let opcionesMenu = '';
        if (esDueno || esAdmin) {
            opcionesMenu = `
                <li><a class="dropdown-item" href="#" onclick="editarPublicacion('${idPubLimpio}')">✏️ Editar</a></li>
                <li><a class="dropdown-item text-danger" href="#" onclick="confirmarEliminar('${idPubLimpio}')">🗑️ Eliminar</a></li>
                <li><hr class="dropdown-divider"></li>
            `;
        }
        opcionesMenu += `<li><a class="dropdown-item" href="#" onclick="abrirModalReporte('${idPubLimpio}', 'Publicacion')">🚩 Reportar</a></li>`;

        let comentariosHTML = renderizarListaComentarios(pub.Id_Publicacion, pub.Mensaje || []);

        const tituloLimpio = escaparHTML(pub.Titulo);
        const contenidoRaw = String(pub.Contenido || '');
        const contenidoCortoLimpio = escaparHTML(contenidoRaw.substring(0, 150));
        const contenidoLargoLimpio = escaparHTML(contenidoRaw);
        const yaLeDioLike = Array.isArray(pub.Likes) && usuarioSesion.id && pub.Likes.some(uid => Number(uid) === Number(usuarioSesion.id));
        const claseBotonLike = yaLeDioLike ? 'btn-danger' : 'btn-outline-danger';
        const botonProductoHTML = pub.Id_Producto ? `
            <button class="btn btn-sm rounded-pill btn-outline-primary me-auto" onclick="verDetalleProducto(${Number(pub.Id_Producto)})">
                🛍️ ${pub.nombre_producto ? escaparHTML(pub.nombre_producto) : 'Ver producto'}
            </button>
        ` : '';

        contenedor.innerHTML += `
            <div class="card mb-4 shadow-sm border-0 text-start">
                <div class="card-header bg-white d-flex align-items-center justify-content-between border-0 pt-3">
                    <div class="d-flex align-items-center">
                        ${avatarHTML}
                        <div>
                            <h6 class="mb-0 fw-bold">${nombreAutorLimpio}</h6>
                            <small class="text-muted" style="font-size: 0.75rem;">${formatearFecha(pub.fecha_Post)}</small>
                        </div>
                    </div>
                    <div class="dropdown">
                        <button class="btn btn-link text-muted p-0" type="button" data-bs-toggle="dropdown" style="text-decoration: none;">
                            <span style="font-size: 1.5rem; font-weight: bold;">⋮</span>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow-sm border-0">
                            ${opcionesMenu}
                        </ul>
                    </div>
                </div>
                <div class="card-body pb-2">
                    <h5 class="card-title fw-bold text-primary">${tituloLimpio}</h5>
                    ${contenidoRaw.length > 150 ? `
                        <p class="card-text text-muted mb-1">
                            <span id="texto-corto-${idPubLimpio}">${contenidoCortoLimpio}...</span>
                            <span id="texto-largo-${idPubLimpio}" class="d-none">${contenidoLargoLimpio}</span>
                            <a href="javascript:void(0)" class="text-primary text-decoration-none fw-bold ms-1" id="btn-leer-${idPubLimpio}" onclick="alternarTexto('${idPubLimpio}')">Leer más</a>
                        </p>
                    ` : `
                        <p class="card-text text-muted">${contenidoLargoLimpio}</p>
                    `}
                </div>
                ${imagenHTML}
                <div class="card-footer bg-white border-top-0 pt-3">
                    <div class="contenedor-comentarios mb-3" id="comentarios-post-${idPubLimpio}" style="max-height: 280px; overflow-y: auto;">
                        ${comentariosHTML}
                    </div>
                    <div class="input-group input-group-sm mb-2">
                        <input type="text" class="form-control rounded-pill-start bg-light border-0" 
                               placeholder="Escribe un comentario..." id="input-msg-${idPubLimpio}">
                        <button class="btn btn-primary rounded-pill-end px-3" onclick="enviarComentario('${idPubLimpio}')">Enviar</button>
                    </div>
                </div>
                <div class="card-footer bg-white d-flex justify-content-end align-items-center border-0 pt-0 pb-3">
                    ${botonProductoHTML}
                    <button class="btn btn-sm rounded-pill ${claseBotonLike}" onclick="darLike('${idPubLimpio}', this)">
                        ❤️ <span class="contador-likes">${pub.Likes ? pub.Likes.length : 0}</span>
                    </button>
                </div>
            </div>`;
    });
}

function renderizarListaComentarios(idPublicacion, listaMensajes) {
    const idPubLimpio = escaparHTML(idPublicacion);
    if (!listaMensajes || listaMensajes.length === 0) return '';

    return listaMensajes.map(msg => {
        const nombreMsgLimpio = escaparHTML(msg.nombre_usuario || 'Usuario');
        const inicialMsg = escaparHTML((msg.nombre_usuario || "U").charAt(0).toUpperCase());
        const fotoMsgLimpia = msg.foto_usuario ? escaparHTML(msg.foto_usuario) : '';
        const idMsgLimpio = escaparHTML(msg.ID_Mensaje);
        const contenidoMsgLimpio = escaparHTML(msg.Contenido);

        let respuestasHTML = '';
        if (msg.Detalle && msg.Detalle.length > 0) {
            respuestasHTML = `<div class="mt-2 ps-3 border-start border-2 border-secondary-subtle">` +
                msg.Detalle.map(det => {
                    const nombreDetLimpio = escaparHTML(det.nombre_usuario || 'Usuario');
                    const comentarioDetLimpio = escaparHTML(det.Comentario);
                    const fechaDet = det.fecha ? formatearFecha(det.fecha) : '';
                    return `
                        <div class="mb-1 py-1 px-2 rounded bg-white">
                            <div class="d-flex justify-content-between align-items-center">
                                <span class="fw-bold text-primary" style="font-size: 0.75rem;">↳ ${nombreDetLimpio}</span>
                                <small class="text-muted" style="font-size: 0.65rem;">${fechaDet}</small>
                            </div>
                            <div class="text-secondary" style="font-size: 0.8rem;">${comentarioDetLimpio}</div>
                        </div>
                    `;
                }).join('') +
            `</div>`;
        }

        return `
            <div class="mb-2 p-2 rounded shadow-sm" style="font-size: 0.85rem; background-color: #f8f9fa; border-left: 3px solid #0d6efd;">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        ${fotoMsgLimpia 
                            ? `<img src="${fotoMsgLimpia}" class="rounded-circle me-1" style="width: 22px; height: 22px; object-fit: cover;">` 
                            : `<div class="bg-secondary rounded-circle text-white d-flex justify-content-center align-items-center me-1" style="width: 22px; height: 22px; font-size: 0.6rem;">${inicialMsg}</div>`}
                        <span class="fw-bold text-dark small">${nombreMsgLimpio}</span>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <small class="text-muted" style="font-size: 0.7rem;">${msg.fecha_E ? formatearFecha(msg.fecha_E) : ''}</small>
                        <button class="btn btn-link text-primary p-0 border-0 text-decoration-none small" title="Responder comentario" onclick="mostrarCajaRespuesta('${idPubLimpio}', '${idMsgLimpio}')">↩️</button>
                        <button class="btn btn-link text-danger p-0 border-0 text-decoration-none" title="Reportar comentario" onclick="abrirModalReporte('${idMsgLimpio}', 'Mensaje')">🚩</button>
                    </div>
                </div>
                <div class="text-secondary mt-1" style="padding-left: 28px;">${contenidoMsgLimpio}</div>
                ${respuestasHTML}
                <div class="input-group input-group-sm mt-2 d-none" id="reply-box-${idPubLimpio}-${idMsgLimpio}">
                    <input type="text" class="form-control bg-white" placeholder="Responder a ${nombreMsgLimpio}..." id="input-reply-${idPubLimpio}-${idMsgLimpio}">
                    <button class="btn btn-outline-primary" onclick="enviarRespuestaComentario('${idPubLimpio}', '${idMsgLimpio}')">Responder</button>
                </div>
            </div>
        `;
    }).join('');
}

function mostrarCajaRespuesta(idPub, idMsg) {
    const box = document.getElementById(`reply-box-${idPub}-${idMsg}`);
    if (box) {
        box.classList.toggle('d-none');
        if (!box.classList.contains('d-none')) {
            document.getElementById(`input-reply-${idPub}-${idMsg}`)?.focus();
        }
    }
}

async function refrescarComentariosPost(idPub) {
    const res = await obtenerMensajesApi(idPub);
    if (res.status === 200 && res.data && Array.isArray(res.data.data)) {
        const contenedor = document.getElementById(`comentarios-post-${idPub}`);
        if (contenedor) {
            contenedor.innerHTML = renderizarListaComentarios(idPub, res.data.data);
        }
        if (window.publicacionesCargadas) {
            const pub = window.publicacionesCargadas.find(p => String(p.Id_Publicacion) === String(idPub));
            if (pub) pub.Mensaje = res.data.data;
        }
    } else {
        cargarPublicaciones();
    }
}

async function enviarRespuestaComentario(idPub, idMsg) {
    const input = document.getElementById(`input-reply-${idPub}-${idMsg}`);
    const comentario = input ? input.value.trim() : '';
    if (!comentario) return;
    const res = await responderComentarioApi(idPub, idMsg, comentario);
    if (res.status === 200 || res.status === 201) {
        input.value = '';
        await refrescarComentariosPost(idPub);
    } else {
        alert(res.data?.mensaje || "No se pudo enviar la respuesta");
    }
}

async function verDetalleProducto(idProducto) {
    const modalEl = document.getElementById('modalDetalleProducto');
    const cuerpo = document.getElementById('cuerpoDetalleProducto');
    if (!modalEl || !cuerpo) return;

    cuerpo.innerHTML = '<div class="text-center py-3"><div class="spinner-border text-primary" role="status"></div></div>';
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();

    const res = await obtenerProductoPorIdApi(idProducto);
    if (res.status === 200 && res.data) {
        const p = res.data;
        let nombreVendedor = p.nombre_vendedor || p.nombre_completo_vendedor || '';
        if (!nombreVendedor && p.Id_Usuario) {
            try {
                const resUser = await obtenerUsuarioPorIdApi(p.Id_Usuario);
                if (resUser.status === 200 && resUser.data) {
                    nombreVendedor = resUser.data.nombre_Usuario || resUser.data.nombre_Completo || '';
                }
            } catch (e) {}
        }
        if (!nombreVendedor) nombreVendedor = 'Vendedor de Brooki';

        const badge = p.Disponible ? '<span class="badge bg-success">Disponible</span>' : '<span class="badge bg-danger">Agotado</span>';
        cuerpo.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <h5 class="fw-bold text-dark mb-0">${escaparHTML(p.nombre_Producto)}</h5>
                ${badge}
            </div>
            <h4 class="text-primary fw-bold mb-3">$${escaparHTML(p.Precio)}</h4>
            <p class="text-muted mb-3">${escaparHTML(p.Descripcion)}</p>
            <div class="d-flex justify-content-between align-items-center border-top pt-2">
                <small class="text-muted">Vendedor: <strong>${escaparHTML(nombreVendedor)}</strong></small>
                <button class="btn btn-sm btn-outline-danger rounded-pill" onclick="bootstrap.Modal.getInstance(document.getElementById('modalDetalleProducto')).hide(); abrirModalReporte('${escaparHTML(p.Id_Producto)}', 'Producto')">🚩 Reportar producto</button>
            </div>
        `;
    } else {
        cuerpo.innerHTML = '<p class="text-danger text-center mb-0">El producto ya no se encuentra disponible.</p>';
    }
}

// -----------------------------------------------------------
// MAGIA DEL BUSCADOR: Filtrar en tiempo real al escribir
// -----------------------------------------------------------
document.getElementById('inputBuscador')?.addEventListener('input', (event) => {
    // Obtenemos lo que escribió el usuario y lo pasamos a minúsculas
    const textoBuscado = event.target.value.toLowerCase().trim();
    
    if(!window.publicacionesCargadas) return;

    // Filtramos la lista buscando coincidencias en Título, Contenido o Nombre de Usuario
    const publicacionesFiltradas = window.publicacionesCargadas.filter(pub => {
        const titulo = (pub.Titulo || '').toLowerCase();
        const contenido = (pub.Contenido || '').toLowerCase();
        const autor = (pub.nombre_usuario || '').toLowerCase();

        return titulo.includes(textoBuscado) || 
               contenido.includes(textoBuscado) || 
               autor.includes(textoBuscado);
    });

    // Mandamos dibujar solo las que pasaron el filtro
    dibujarPublicaciones(publicacionesFiltradas);
});

// FUNCIONES AUXILIARES
function formatearFecha(fechaISO) {
    if (!fechaISO) return "";
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-MX', { 
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
}

function verImagenGrande(url) {
    const imgVisor = document.getElementById('imagenAmpliacion');
    if (imgVisor) {
        imgVisor.src = url;
        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalVisorImagen'));
        modal.show();
    }
}

async function darLike(id, btn) {
    const res = await toggleLikeApi(id); 
    if (res.status === 200) {
        btn.querySelector('.contador-likes').innerText = res.data.totalLikes;
        const agregoLike = res.data.mensaje === 'Like agregado';
        btn.classList.toggle('btn-danger', agregoLike);
        btn.classList.toggle('btn-outline-danger', !agregoLike);

        // Actualizar el estado en memoria para no perderlo al filtrar en el buscador
        let usuarioSesion = {};
        try { usuarioSesion = JSON.parse(localStorage.getItem('usuario')) || {}; } catch (e) {}
        const idUser = Number(usuarioSesion.id);
        if (window.publicacionesCargadas && idUser) {
            const pub = window.publicacionesCargadas.find(p => String(p.Id_Publicacion) === String(id));
            if (pub) {
                if (!Array.isArray(pub.Likes)) pub.Likes = [];
                if (agregoLike) {
                    if (!pub.Likes.some(u => Number(u) === idUser)) pub.Likes.push(idUser);
                } else {
                    pub.Likes = pub.Likes.filter(u => Number(u) !== idUser);
                }
            }
        }
    }
}

async function enviarComentario(id) {
    const input = document.getElementById(`input-msg-${id}`);
    const contenido = input.value.trim();
    if (!contenido) return;
    const res = await publicarComentarioApi(id, contenido);
    if (res.status === 200 || res.status === 201) {
        input.value = '';
        await refrescarComentariosPost(id);
    }
}

async function confirmarEliminar(id) {
    if (confirm('¿Eliminar esta publicación?')) {
        const token = localStorage.getItem('token');
        const res = await fetch(`https://brookinodejs.onrender.com/api/publicacion/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.exito) cargarPublicaciones();
    }
}

// Abrir el modal y cargar los datos actuales
function editarPublicacion(id) {
    // Buscamos la publicación en la lista que guardamos
    const pub = window.publicacionesCargadas.find(p => String(p.Id_Publicacion) === String(id));
    
    if (pub) {
        // Llenamos los campos del modal
        document.getElementById('editIdPublicacion').value = pub.Id_Publicacion;
        document.getElementById('editTitulo').value = pub.Titulo;
        document.getElementById('editContenido').value = pub.Contenido;
        const inputImg = document.getElementById('editImagenPublicacion');
        if (inputImg) inputImg.value = '';
        
        // Abrimos el modal de Bootstrap
        const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEditarPublicacion'));
        modal.show();
    }
}

// Enviar los cambios al servidor
async function guardarEdicion() {
    const id = document.getElementById('editIdPublicacion').value;
    const titulo = document.getElementById('editTitulo').value.trim();
    const contenido = document.getElementById('editContenido').value.trim();
    const inputImg = document.getElementById('editImagenPublicacion');
    const btnGuardar = document.getElementById('btnGuardarEdicion');

    if (!titulo || !contenido) {
        alert("El título y el contenido no pueden estar vacíos.");
        return;
    }

    btnGuardar.disabled = true;
    btnGuardar.innerText = "Guardando...";

    const res = await editarPublicacionApi(id, titulo, contenido);

    if (res.status === 200 || res.status === 201) {
        if (inputImg && inputImg.files && inputImg.files.length > 0) {
            btnGuardar.innerText = "Subiendo imagen...";
            await subirImagenApi(id, inputImg.files[0]);
        }

        // Cerramos el modal
        const modalElement = document.getElementById('modalEditarPublicacion');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();
        
        // Recargamos el muro para ver los cambios
        cargarPublicaciones();
    } else {
        alert("Error al actualizar: " + (res.data.mensaje || "Error desconocido"));
    }

    btnGuardar.disabled = false;
    btnGuardar.innerText = "Guardar Cambios";
}
// Abrir el modal universal
function abrirModalReporte(id, tipo) {
    document.getElementById('reportIdReferencia').value = id;
    document.getElementById('reportTipoReferencia').value = tipo; // Le decimos si es Mensaje o Publicacion
    document.getElementById('reportMotivo').value = ''; 
    document.getElementById('reportImagen').value = ''; // Limpiamos el input de imagen
    
    const modal = new bootstrap.Modal(document.getElementById('modalReportarPublicacion'));
    modal.show();
}

// Enviar el reporte completo
async function enviarReporte() {
    const id = document.getElementById('reportIdReferencia').value;
    const tipo = document.getElementById('reportTipoReferencia').value;
    const motivo = document.getElementById('reportMotivo').value.trim();
    const inputImagen = document.getElementById('reportImagen');
    const btnEnviar = document.getElementById('btnEnviarReporte');

    if (!motivo) {
        alert("Por favor, ingresa un motivo para el reporte.");
        return;
    }

    btnEnviar.disabled = true;
    btnEnviar.innerText = "Creando reporte...";

    // 1. Creamos el texto del reporte
    const res = await reportarApi(id, tipo, motivo);

    if (res.status === 200 || res.status === 201) {
        // 2. Si el usuario seleccionó una imagen, la subimos
        if (inputImagen.files.length > 0) {
            btnEnviar.innerText = "Subiendo evidencia...";
            const archivo = inputImagen.files[0];
            
            // Extraemos el ID del nuevo reporte que nos mandó el backend
            // Según tu controlador, viene en res.data.data.id_Reporte o Id_Reporte
            const idNuevoReporte = res.data.data.id_Reporte || res.data.data.Id_Reporte;
            
            if(idNuevoReporte) {
                const resImagen = await subirImagenReporteApi(idNuevoReporte, archivo);
                if(resImagen.status !== 200 && resImagen.status !== 201) {
                    alert("El reporte se envió, pero la imagen falló.");
                }
            }
        }

        // 3. Todo listo, cerramos y avisamos
        const modalElement = document.getElementById('modalReportarPublicacion');
        const modalInstance = bootstrap.Modal.getInstance(modalElement);
        modalInstance.hide();
        
        alert("Gracias. Hemos recibido tu reporte y lo revisaremos pronto.");
    } else {
        alert("Error al enviar el reporte: " + (res.data.mensaje || "Inténtalo más tarde"));
    }

    btnEnviar.disabled = false;
    btnEnviar.innerText = "Enviar Reporte";
}

// Ocultar/Mostrar textos muy largos en el muro
function alternarTexto(idPublicacion) {
    const textoCorto = document.getElementById(`texto-corto-${idPublicacion}`);
    const textoLargo = document.getElementById(`texto-largo-${idPublicacion}`);
    const btnLeer = document.getElementById(`btn-leer-${idPublicacion}`);

    if (textoLargo.classList.contains('d-none')) {
        // Mostrar todo el texto
        textoLargo.classList.remove('d-none');
        textoCorto.classList.add('d-none');
        btnLeer.innerText = 'Mostrar menos';
    } else {
        // Volver a ocultar
        textoLargo.classList.add('d-none');
        textoCorto.classList.remove('d-none');
        btnLeer.innerText = 'Leer más';
    }
}
