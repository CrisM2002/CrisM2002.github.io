const API_BASE = 'https://brookinodejs.onrender.com/api';
let tokenGlobal = '';

document.addEventListener('DOMContentLoaded', () => {
    // 1. EL GUARDIA DE SEGURIDAD
    tokenGlobal = localStorage.getItem('token');
    let usuario = {};
    try { usuario = JSON.parse(localStorage.getItem('usuario')) || {}; } catch(e){}

    const rol = String(usuario.Rol || usuario.rol || '').toLowerCase();

    if (!tokenGlobal || rol !== 'admin') {
        alert("🛡️ ALERTA: Acceso denegado. Esta área es exclusiva para Administradores.");
        window.location.href = 'index.html';
        return;
    }

    // 2. Si pasó, cargamos toda la información
    cargarDatosGenerales();
});

async function cargarDatosGenerales() {
    await Promise.all([
        cargarTablaUsuarios(),
        cargarTablaPublicaciones(),
        cargarTablaReportes() // <--- NUEVA LÍNEA
    ]);
}

// ==========================================
// MÓDULO: USUARIOS
// ==========================================
async function cargarTablaUsuarios() {
    const tbody = document.getElementById('tablaUsuarios');
    try {
        // Asumiendo que tu ruta para obtener todos los usuarios es GET /api/usuario
        const res = await fetch(`${API_BASE}/usuario`, { headers: { 'Authorization': `Bearer ${tokenGlobal}` }});
        if (res.ok) {
            const usuarios = await res.json();
            document.getElementById('statUsuarios').innerText = usuarios.length || 0;
            
            tbody.innerHTML = '';
            usuarios.forEach(u => {
                const esAdmin = String(u.Rol).toLowerCase() === 'admin';
                const btnEliminar = esAdmin ? 
                    `<button class="btn btn-sm btn-secondary" disabled>Admin</button>` : 
                    `<button class="btn btn-sm btn-danger fw-bold" onclick="eliminarUsuario(${u.Id_Usuario})">Eliminar</button>`;

                tbody.innerHTML += `
                    <tr>
                        <td class="fw-bold text-muted">#${u.Id_Usuario}</td>
                        <td>${u.nombre_Completo}</td>
                        <td>${u.Correo}</td>
                        <td><span class="badge ${esAdmin ? 'bg-danger' : 'bg-primary'}">${u.Rol}</span></td>
                        <td class="text-end">${btnEliminar}</td>
                    </tr>
                `;
            });
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-danger text-center">Error al cargar usuarios</td></tr>';
    }
}

async function eliminarUsuario(id) {
    if(confirm("¿Estás 100% seguro de que deseas ELIMINAR a este usuario permanentemente?")) {
        try {
            const res = await fetch(`${API_BASE}/usuario/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${tokenGlobal}` }
            });
            if (res.ok) {
                cargarTablaUsuarios(); // Refrescar la tabla
            } else {
                alert("Error al eliminar el usuario.");
            }
        } catch(e) { alert("Error de conexión"); }
    }
}

// ==========================================
// MÓDULO: PUBLICACIONES
// ==========================================
async function cargarTablaPublicaciones() {
    const tbody = document.getElementById('tablaPublicaciones');
    try {
        // CORRECCIÓN 1: Actualizamos la URL a /publicacion/buscar (como en Postman)
        const res = await fetch(`${API_BASE}/publicacion/buscar`, { 
            headers: { 'Authorization': `Bearer ${tokenGlobal}` }
        });
        
        if (res.ok) {
            const respuesta = await res.json();
            // Tu Postman muestra que el arreglo viene dentro de "data"
            const publicaciones = respuesta.data || [];
            
            document.getElementById('statPublicaciones').innerText = publicaciones.length || 0;
            
            tbody.innerHTML = '';
            publicaciones.forEach(p => {
                // CORRECCIÓN 2: Usamos "fecha_Post" en lugar de "Fecha"
                const fecha = p.fecha_Post ? new Date(p.fecha_Post).toLocaleDateString() : 'N/A';
                
                tbody.innerHTML += `
                    <tr>
                        <td class="fw-bold text-muted">#${p.Id_Publicacion}</td>
                        <td>Usuario #${p.Id_Usuario}</td>
                        <td class="text-truncate" style="max-width: 200px;">${p.Titulo}</td>
                        <td>${fecha}</td>
                        <td class="text-end">
                            <button class="btn btn-sm btn-danger fw-bold" onclick="eliminarPublicacion('${p.Id_Publicacion}')">Borrar Post</button>
                        </td>
                    </tr>
                `;
            });
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-danger text-center">Error al cargar publicaciones</td></tr>';
    }
}

async function eliminarPublicacion(id) {
    if(confirm("¿Deseas borrar esta publicación del muro público?")) {
        try {
            const res = await fetch(`${API_BASE}/publicacion/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${tokenGlobal}` }
            });
            if (res.ok) {
                cargarTablaPublicaciones(); // Refrescar la tabla
            } else {
                alert("Error al eliminar la publicación.");
            }
        } catch(e) { alert("Error de conexión"); }
    }
}

// ==========================================
// MÓDULO: REPORTES
// ==========================================
async function cargarTablaReportes() {
    const tbody = document.getElementById('tablaReportes');
    try {
        // ⚠️ ATENCIÓN: Cambia esta URL por la ruta exacta de tu backend según tu Postman
        const res = await fetch(`${API_BASE}/reporte`, { 
            headers: { 'Authorization': `Bearer ${tokenGlobal}` }
        });
        
        if (res.ok) {
            const respuesta = await res.json();
            const reportes = respuesta.data || respuesta || []; // Adaptable a tu formato
            
            document.getElementById('statReportes').innerText = reportes.length || 0;
            
            tbody.innerHTML = '';
            
            if (reportes.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay reportes pendientes. ¡Todo en orden!</td></tr>';
                return;
            }

           reportes.forEach(r => {
                // 1. MAPEAMOS EXACTAMENTE COMO ESTÁ EN TU BASE DE DATOS
                const idReporte = r.id_Reporte;
                const idElemento = `${r.Tipo_Referencia} #${r.Id_Referencia}`; // Ej: Publicacion #PUB-005
                const motivo = r.motivo;
                const estado = r.estado;
                
                // 2. Colores dinámicos para el estado
                const badgeEstado = String(estado).toLowerCase() === 'resuelto' ? 'bg-success' : 'bg-warning text-dark';

                // 3. Dibujamos la fila
                tbody.innerHTML += `
                    <tr>
                        <td class="fw-bold text-muted">#${idReporte}</td>
                        <td>${idElemento}</td>
                        <td>${motivo}</td>
                        <td><span class="badge ${badgeEstado}">${estado}</span></td>
                        <td class="text-end">
                            <button class="btn btn-sm btn-primary fw-bold me-1" onclick="abrirModalRespuesta('${idReporte}')">✏️ Responder</button>
                            <button class="btn btn-sm btn-outline-danger fw-bold" onclick="eliminarReporte('${idReporte}')">🗑️</button>
                        </td>
                    </tr>
                `;
            });
        } else {
            // Si la ruta devuelve 404 u otro error, mostramos 0
            document.getElementById('statReportes').innerText = "0";
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No se encontró la ruta de reportes.</td></tr>';
        }
    } catch (e) {
        document.getElementById('statReportes').innerText = "--";
        tbody.innerHTML = '<tr><td colspan="5" class="text-danger text-center">Error al conectar con reportes</td></tr>';
    }
}


async function eliminarReporte(id) {
    if(confirm("¿Eliminar este reporte del sistema?")) {
        try {
            // ⚠️ ATENCIÓN: Cambia esta URL por tu ruta real de eliminación (DELETE)
            const res = await fetch(`${API_BASE}/reporte/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${tokenGlobal}` }
            });
            if (res.ok) cargarTablaReportes();
            else alert("Error al eliminar el reporte.");
        } catch(e) { alert("Error de conexión"); }
    }
}

// Abre la ventana y prepara el terreno
function abrirModalRespuesta(id) {
    document.getElementById('reporteIdActual').value = id;
    document.getElementById('respuestaAdminTexto').value = ''; // Limpiamos el texto
    const modal = new bootstrap.Modal(document.getElementById('modalResponderReporte'));
    modal.show();
}

// Procesa el reporte dependiendo de si elegiste "Responder" o "Resolver"
async function procesarReporte(accion) {
    const id = document.getElementById('reporteIdActual').value;
    const respuestaTexto = document.getElementById('respuestaAdminTexto').value.trim();
    
    const btnResponder = document.getElementById('btnSoloResponder');
    const btnResolver = document.getElementById('btnResolver');

    // 1. Armamos el paquete de datos (payload) según el botón presionado
    let datosParaEnviar = {};

    if (accion === 'responder') {
        if (!respuestaTexto) {
            alert("Para enviar una respuesta, primero debes escribir un mensaje.");
            return;
        }
        // Solo mandamos el texto, el estado en la base de datos no se toca
        datosParaEnviar = { Respuesta_Admin: respuestaTexto };
        
    } else if (accion === 'resolver') {
        // Mandamos el estado "Resuelto". Si el admin escribió algo, también lo adjuntamos.
        datosParaEnviar = { estado: 'Resuelto' };
        if (respuestaTexto) {
            datosParaEnviar.Respuesta_Admin = respuestaTexto;
        }
    }

    // 2. Bloqueamos los botones mientras carga
    btnResponder.disabled = true;
    btnResolver.disabled = true;

    try {
        const res = await fetch(`${API_BASE}/reporte/${id}`, {
            method: 'PUT',
            headers: { 
                'Authorization': `Bearer ${tokenGlobal}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosParaEnviar)
        });

        if (res.ok) {
            // Éxito: Cerramos el modal y recargamos la tabla
            const modalElement = document.getElementById('modalResponderReporte');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            modalInstance.hide();
            
            cargarTablaReportes();
        } else {
            alert("Error al actualizar el reporte en el servidor.");
        }
    } catch(e) { 
        alert("Error de conexión con el servidor."); 
    } finally {
        // Desbloqueamos los botones por si hubo error y necesita reintentar
        btnResponder.disabled = false;
        btnResolver.disabled = false;
    }
}