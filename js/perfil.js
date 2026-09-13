document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificar seguridad
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Lógica de cerrar sesión
    document.getElementById('btnCerrarSesionPerfil').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = 'login.html';
    });

    // 3. Cargar la página
    cargarDatosPerfil();
    cargarMisPublicaciones();
});

// Extrae los datos que guardaste en el login y los pone en la tarjeta
function cargarDatosPerfil() {
    let usuario = {};
    try {
        const storedUser = localStorage.getItem('usuario');
        if (storedUser) usuario = JSON.parse(storedUser);
    } catch (e) { }

    const nombreVisible = usuario.nombreCompleto || usuario.nombreUsuario || 'Usuario';
    const correoVisible = usuario.correo || 'correo no registrado';
    const rolVisible = usuario.rol || 'Usuario';
    const fotoVisible = usuario.foto || usuario.Foto_Perfil; // <-- Buscamos la foto

    document.getElementById('nombrePerfil').innerText = nombreVisible;
    document.getElementById('correoPerfil').innerText = correoVisible;
    document.getElementById('rolPerfil').innerText = rolVisible.toUpperCase();
    
    // Si hay foto, la mostramos y limpiamos el fondo. Si no, ponemos la letra.
    const avatarDiv = document.getElementById('avatarPerfil');
    if (fotoVisible) {
        avatarDiv.innerHTML = `<img src="${fotoVisible}" style="width: 100%; height: 100%; object-fit: contain; border-radius: 50%;">`;
        
        // Magia aquí: Volvemos el fondo transparente y quitamos la sombra
        avatarDiv.style.setProperty('background', 'transparent', 'important');
        avatarDiv.classList.remove('shadow');
        
    } else {
        avatarDiv.innerText = nombreVisible.charAt(0).toUpperCase();
    }
}

// Descarga las publicaciones y filtra solo las tuyas
async function cargarMisPublicaciones() {
    const contenedor = document.getElementById('contenedorMisPublicaciones');
    const respuesta = await obtenerPublicaciones(); // Función de tu api.js

    if (respuesta && respuesta.status === 200) {
        const todasLasPublicaciones = respuesta.data.data || [];
        
        let usuarioSesion = {};
        try { usuarioSesion = JSON.parse(localStorage.getItem('usuario')) || {}; } catch (e) { }

        // EL FILTRO MÁGICO
        const misPublicaciones = todasLasPublicaciones.filter(pub => String(pub.Id_Usuario) === String(usuarioSesion.id));

        if (misPublicaciones.length === 0) {
            contenedor.innerHTML = '<p class="text-center text-muted w-100 py-4">Aún no has creado ninguna publicación. ¡Anímate a compartir algo!</p>';
            return;
        }

        contenedor.innerHTML = '';
        
        misPublicaciones.forEach(pub => {
            const imagenHTML = pub.Imagen ? `
                <div class="position-relative overflow-hidden bg-black" style="height: 250px;">
                    <img src="${pub.Imagen}" class="position-absolute h-100 w-100" style="object-fit: cover; filter: blur(15px); opacity: 0.5;">
                    <img src="${pub.Imagen}" class="position-relative h-100 w-100" style="object-fit: contain; z-index: 2;">
                </div>
            ` : '';

            contenedor.innerHTML += `
                <div class="card mb-4 shadow-sm border-0 text-start" style="border-radius: 24px; overflow: hidden; background: white;">
                    <div class="card-body pb-2 p-4">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h5 class="card-title fw-bold text-primary m-0">${pub.Titulo}</h5>
                            <button class="btn btn-sm btn-outline-danger rounded-pill fw-bold" onclick="eliminarDesdePerfil('${pub.Id_Publicacion}')">🗑️ Eliminar</button>
                        </div>
                        <p class="card-text text-muted">${pub.Contenido}</p>
                    </div>
                    ${imagenHTML}
                    <div class="card-footer bg-white border-top-0 pt-3 pb-4 px-4 d-flex gap-2">
                        <span class="badge bg-light text-dark border p-2 shadow-sm rounded-pill">❤️ ${pub.Likes ? pub.Likes.length : 0} Likes</span>
                        <span class="badge bg-light text-dark border p-2 shadow-sm rounded-pill">💬 ${pub.Mensaje ? pub.Mensaje.length : 0} Comentarios</span>
                    </div>
                </div>`;
        });
    } else {
        contenedor.innerHTML = '<p class="text-danger text-center">Error al cargar tus publicaciones.</p>';
    }
}

// Función exclusiva para borrar desde tu perfil
async function eliminarDesdePerfil(id) {
    if (confirm('¿Estás seguro de que deseas eliminar esta publicación permanentemente?')) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/publicacion/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.status === 200 || res.status === 201) {
            cargarMisPublicaciones(); // Recargamos el historial
        } else {
            alert("Hubo un error al intentar eliminar la publicación.");
        }
    }
}

// Abrir el modal
function abrirModalEditarPerfil() {
    let usuario = {};
    try { usuario = JSON.parse(localStorage.getItem('usuario')) || {}; } catch (e) { }

    const nombreActual = usuario.nombreUsuario || '';
    document.getElementById('editNombrePerfil').value = nombreActual;
    document.getElementById('editContrasenaPerfil').value = '';
    document.getElementById('editFotoPerfil').value = '';

    const modal = new bootstrap.Modal(document.getElementById('modalEditarPerfil'));
    modal.show();
}

// Guardar los cambios
async function guardarCambiosPerfil() {
    let usuario = {};
    try { usuario = JSON.parse(localStorage.getItem('usuario')) || {}; } catch (e) { }
    
    if (!usuario.id) {
        alert("Error: No se pudo identificar tu usuario.");
        return;
    }

    const idUsuario = usuario.id;
    const nuevoNombre = document.getElementById('editNombrePerfil').value.trim();
    const nuevaContrasena = document.getElementById('editContrasenaPerfil').value.trim();
    const inputFoto = document.getElementById('editFotoPerfil');
    const btnGuardar = document.getElementById('btnGuardarPerfil');

    btnGuardar.disabled = true;
    btnGuardar.innerText = "Guardando...";

    // A. Actualizar texto (Nombre o contraseña)
    // ATENCIÓN: Enviamos todos los campos que tu usuario.model.js requiere
    let datosActualizar = {
        nombre_Usuario: nuevoNombre || usuario.nombreUsuario,
        nombre_Completo: usuario.nombreCompleto, 
        Rol: usuario.rol
    };
    
    if (nuevaContrasena) datosActualizar.Contrasena = nuevaContrasena;

    // Actualizamos texto en el servidor
    const resDatos = await actualizarUsuarioApi(idUsuario, datosActualizar);
    if (resDatos.status === 200 || resDatos.status === 201) {
        usuario.nombreUsuario = datosActualizar.nombre_Usuario;
        localStorage.setItem('usuario', JSON.stringify(usuario));
    } else {
        alert("Error al actualizar datos: " + (resDatos.data.mensaje || "Error desconocido"));
    }

    // B. Subir la Foto de Perfil
    if (inputFoto.files.length > 0) {
        btnGuardar.innerText = "Subiendo foto...";
        const archivo = inputFoto.files[0];
        const resFoto = await subirFotoPerfilApi(idUsuario, archivo);
        
        if (resFoto.status === 200 || resFoto.status === 201) {
            // NUEVO: Guardamos la URL que nos devuelve Node.js en la memoria del navegador
            usuario.foto = resFoto.data.url;
            localStorage.setItem('usuario', JSON.stringify(usuario));
        } else {
            alert("Los datos se guardaron, pero la foto falló.");
        }
    }   
    // Terminamos
    const modalElement = document.getElementById('modalEditarPerfil');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    modalInstance.hide();
    
    btnGuardar.disabled = false;
    btnGuardar.innerText = "Guardar Cambios";

    // Recargamos la página para ver los cambios
    window.location.reload();
}