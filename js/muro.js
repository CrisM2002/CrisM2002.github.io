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

    contenedor.innerHTML = '<div class="text-center w-100"><div class="spinner-border text-primary" role="status"></div></div>';

    const respuesta = await obtenerPublicaciones(); 

    if (respuesta && respuesta.status === 200) {
        // Guardamos los datos globalmente
        window.publicacionesCargadas = respuesta.data.data || [];
        // Mandamos dibujar todas las publicaciones
        dibujarPublicaciones(window.publicacionesCargadas);
    } else {
        contenedor.innerHTML = '<p class="text-danger text-center">Error al conectar con el servidor.</p>';
    }
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
        const avatarHTML = pub.foto_usuario 
            ? `<img src="${pub.foto_usuario}" class="rounded-circle me-2 shadow-sm" style="width: 40px; height: 40px; object-fit: cover;">`
            : `<div class="bg-primary rounded-circle text-white d-flex justify-content-center align-items-center me-2 shadow-sm" style="width: 40px; height: 40px; font-weight: bold;">
                  ${(pub.nombre_usuario || "U").charAt(0).toUpperCase()}
               </div>`;

        const imagenHTML = pub.Imagen ? `
            <div class="position-relative overflow-hidden bg-black" style="cursor: pointer; height: 400px;" onclick="verImagenGrande('${pub.Imagen}')">
                <img src="${pub.Imagen}" class="position-absolute h-100 w-100" style="object-fit: cover; filter: blur(15px); opacity: 0.5; top:0; left:0;">
                <img src="${pub.Imagen}" class="position-relative h-100 w-100" style="object-fit: contain; z-index: 2;">
            </div>
        ` : '';

        const esDueno = usuarioSesion.id && String(pub.Id_Usuario) === String(usuarioSesion.id);
        const esAdmin = usuarioSesion.rol === 'admin';

        let opcionesMenu = '';
        if (esDueno || esAdmin) {
            opcionesMenu = `
                <li><a class="dropdown-item" href="#" onclick="editarPublicacion('${pub.Id_Publicacion}')">✏️ Editar</a></li>
                <li><a class="dropdown-item text-danger" href="#" onclick="confirmarEliminar('${pub.Id_Publicacion}')">🗑️ Eliminar</a></li>
                <li><hr class="dropdown-divider"></li>
            `;
        }
        opcionesMenu += `<li><a class="dropdown-item" href="#" onclick="abrirModalReporte('${pub.Id_Publicacion}', 'Publicacion')">🚩 Reportar</a></li>`;

        let comentariosHTML = '';
        if (pub.Mensaje && pub.Mensaje.length > 0) {
            comentariosHTML = pub.Mensaje.map(msg => `
                <div class="mb-2 p-2 rounded shadow-sm" style="font-size: 0.85rem; background-color: #f8f9fa; border-left: 3px solid #0d6efd;">
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            ${msg.foto_usuario 
                                ? `<img src="${msg.foto_usuario}" class="rounded-circle me-1" style="width: 22px; height: 22px; object-fit: cover;">` 
                                : `<div class="bg-secondary rounded-circle text-white d-flex justify-content-center align-items-center me-1" style="width: 22px; height: 22px; font-size: 0.6rem;">${(msg.nombre_usuario || "U").charAt(0).toUpperCase()}</div>`}
                            <span class="fw-bold text-dark small">${msg.nombre_usuario || 'Usuario'}</span>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                            <small class="text-muted" style="font-size: 0.7rem;">${msg.fecha_E ? formatearFecha(msg.fecha_E) : ''}</small>
                            <button class="btn btn-link text-danger p-0 border-0 text-decoration-none" title="Reportar comentario" onclick="abrirModalReporte('${msg.ID_Mensaje}', 'Mensaje')">🚩</button>
                        </div>
                    </div>
                    <div class="text-secondary mt-1" style="padding-left: 28px;">${msg.Contenido}</div>
                </div>
            `).join('');
        }

        contenedor.innerHTML += `
            <div class="card mb-4 shadow-sm border-0 text-start">
                <div class="card-header bg-white d-flex align-items-center justify-content-between border-0 pt-3">
                    <div class="d-flex align-items-center">
                        ${avatarHTML}
                        <div>
                            <h6 class="mb-0 fw-bold">${pub.nombre_usuario || 'Usuario'}</h6>
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
                    <h5 class="card-title fw-bold text-primary">${pub.Titulo}</h5>
                    ${pub.Contenido && pub.Contenido.length > 150 ? `
                        <p class="card-text text-muted mb-1">
                            <span id="texto-corto-${pub.Id_Publicacion}">${pub.Contenido.substring(0, 150)}...</span>
                            <span id="texto-largo-${pub.Id_Publicacion}" class="d-none">${pub.Contenido}</span>
                            <a href="javascript:void(0)" class="text-primary text-decoration-none fw-bold ms-1" id="btn-leer-${pub.Id_Publicacion}" onclick="alternarTexto('${pub.Id_Publicacion}')">Leer más</a>
                        </p>
                    ` : `
                        <p class="card-text text-muted">${pub.Contenido}</p>
                    `}
                </div>
                ${imagenHTML}
                <div class="card-footer bg-white border-top-0 pt-3">
                    <div class="contenedor-comentarios mb-3" style="max-height: 250px; overflow-y: auto;">
                        ${comentariosHTML}
                    </div>
                    <div class="input-group input-group-sm mb-2">
                        <input type="text" class="form-control rounded-pill-start bg-light border-0" 
                               placeholder="Escribe un comentario..." id="input-msg-${pub.Id_Publicacion}">
                        <button class="btn btn-primary rounded-pill-end px-3" onclick="enviarComentario('${pub.Id_Publicacion}')">Enviar</button>
                    </div>
                </div>
                <div class="card-footer bg-white d-flex justify-content-end border-0 pt-0 pb-3">
                    <button class="btn btn-sm rounded-pill btn-outline-danger" onclick="darLike('${pub.Id_Publicacion}', this)">
                        ❤️ <span class="contador-likes">${pub.Likes ? pub.Likes.length : 0}</span>
                    </button>
                </div>
            </div>`;
    });
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
        const modal = new bootstrap.Modal(document.getElementById('modalVisorImagen'));
        modal.show();
    }
}

async function darLike(id, btn) {
    const res = await toggleLikeApi(id); 
    if (res.status === 200) btn.querySelector('.contador-likes').innerText = res.data.totalLikes;
}

async function enviarComentario(id) {
    const input = document.getElementById(`input-msg-${id}`);
    const contenido = input.value.trim();
    if (!contenido) return;
    const res = await publicarComentarioApi(id, contenido);
    if (res.status === 200 || res.status === 201) {
        input.value = '';
        cargarPublicaciones();
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
        
        // Abrimos el modal de Bootstrap
        const modal = new bootstrap.Modal(document.getElementById('modalEditarPublicacion'));
        modal.show();
    }
}

// Enviar los cambios al servidor
async function guardarEdicion() {
    const id = document.getElementById('editIdPublicacion').value;
    const titulo = document.getElementById('editTitulo').value.trim();
    const contenido = document.getElementById('editContenido').value.trim();
    const btnGuardar = document.getElementById('btnGuardarEdicion');

    if (!titulo || !contenido) {
        alert("El título y el contenido no pueden estar vacíos.");
        return;
    }

    btnGuardar.disabled = true;
    btnGuardar.innerText = "Guardando...";

    const res = await editarPublicacionApi(id, titulo, contenido);

    if (res.status === 200 || res.status === 201) {
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