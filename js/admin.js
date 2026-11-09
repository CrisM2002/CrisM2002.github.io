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
        cargarTablaReportes(),
        cargarEstadisticasReportes()
    ]);
}

function escaparHTMLAdmin(texto) {
    if (texto === null || texto === undefined) return '';
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ==========================================
// MÓDULO: USUARIOS
// ==========================================
function renderizarFilasUsuarios(usuarios) {
    const tbody = document.getElementById('tablaUsuarios');
    tbody.innerHTML = '';
    if (!usuarios || usuarios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No se encontraron usuarios.</td></tr>';
        return;
    }
    usuarios.forEach(u => {
        const esAdmin = String(u.Rol).toLowerCase() === 'admin';
        const idUsuarioLimpio = Number(u.Id_Usuario) || 0;
        const btnEliminar = esAdmin ? 
            `<button class="btn btn-sm btn-secondary" disabled>Admin</button>` : 
            `<button class="btn btn-sm btn-danger fw-bold" onclick="eliminarUsuario(${idUsuarioLimpio})">Eliminar</button>`;

        tbody.innerHTML += `
            <tr>
                <td class="fw-bold text-muted">#${idUsuarioLimpio}</td>
                <td>${escaparHTMLAdmin(u.nombre_Completo || u.nombre_Usuario)}</td>
                <td>${escaparHTMLAdmin(u.Correo)}</td>
                <td><span class="badge ${esAdmin ? 'bg-danger' : 'bg-primary'}">${escaparHTMLAdmin(u.Rol)}</span></td>
                <td class="text-end">${btnEliminar}</td>
            </tr>
        `;
    });
}

async function cargarTablaUsuarios() {
    const tbody = document.getElementById('tablaUsuarios');
    const inputCorreo = document.getElementById('inputBuscarCorreoAdmin');
    if (inputCorreo) inputCorreo.value = '';
    try {
        const res = await fetch(`${API_BASE}/usuario`, { headers: { 'Authorization': `Bearer ${tokenGlobal}` }});
        if (res.ok) {
            const usuarios = await res.json();
            document.getElementById('statUsuarios').innerText = usuarios.length || 0;
            renderizarFilasUsuarios(usuarios);
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-danger text-center">Error al cargar usuarios</td></tr>';
    }
}

async function buscarUsuarioPorCorreoAdmin() {
    const correo = document.getElementById('inputBuscarCorreoAdmin').value.trim();
    if (!correo) {
        cargarTablaUsuarios();
        return;
    }
    const tbody = document.getElementById('tablaUsuarios');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Buscando usuario...</td></tr>';
    try {
        const res = await obtenerUsuarioPorCorreoApi(correo);
        if (res.status === 200 && res.data) {
            renderizarFilasUsuarios([res.data]);
        } else {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted">${escaparHTMLAdmin(res.data?.mensaje || 'No se encontró ningún usuario con ese correo.')}</td></tr>`;
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-danger text-center">Error al buscar usuario por correo</td></tr>';
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
        const res = await fetch(`${API_BASE}/publicacion/buscar?limit=100`, { 
            headers: { 'Authorization': `Bearer ${tokenGlobal}` }
        });
        
        if (res.ok) {
            const respuesta = await res.json();
            const publicaciones = respuesta.data || [];
            
            document.getElementById('statPublicaciones').innerText = respuesta.total ?? publicaciones.length ?? 0;
            
            tbody.innerHTML = '';
            publicaciones.forEach(p => {
                const fecha = p.fecha_Post ? new Date(p.fecha_Post).toLocaleDateString() : 'N/A';
                const idPubLimpio = escaparHTMLAdmin(p.Id_Publicacion);
                
                tbody.innerHTML += `
                    <tr>
                        <td class="fw-bold text-muted">#${idPubLimpio}</td>
                        <td>Usuario #${escaparHTMLAdmin(p.Id_Usuario)}</td>
                        <td class="text-truncate" style="max-width: 200px;">${escaparHTMLAdmin(p.Titulo)}</td>
                        <td>${escaparHTMLAdmin(fecha)}</td>
                        <td class="text-end">
                            <button class="btn btn-sm btn-danger fw-bold" onclick="eliminarPublicacion('${idPubLimpio}')">Borrar Post</button>
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
async function cargarEstadisticasReportes() {
    try {
        const res = await obtenerEstadisticasReportesApi();
        if (res.status === 200 && res.data) {
            document.getElementById('statReportes').innerText = res.data.pendientes ?? 0;
            const detalleEl = document.getElementById('statReportesDetalle');
            if (detalleEl) {
                detalleEl.innerText = `Total: ${res.data.total ?? 0} | Resueltos: ${res.data.resueltos ?? 0}`;
            }
        }
    } catch (e) {
        console.warn("No se pudieron cargar las estadísticas de reportes:", e);
    }
}

function renderizarFilasReportes(reportes) {
    const tbody = document.getElementById('tablaReportes');
    tbody.innerHTML = '';

    if (!reportes || reportes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No se encontraron reportes con esos criterios.</td></tr>';
        return;
    }

    reportes.forEach(r => {
        const idReporte = escaparHTMLAdmin(r.id_Reporte);
        const idElemento = escaparHTMLAdmin(`${r.Tipo_Referencia} #${r.Id_Referencia}`);
        const motivo = escaparHTMLAdmin(r.motivo);
        const estado = escaparHTMLAdmin(r.estado);
        const evidenciaHTML = r.Imagen ? `<br><a href="${escaparHTMLAdmin(r.Imagen)}" target="_blank" rel="noopener noreferrer" class="small text-primary fw-bold text-decoration-none">📷 Ver evidencia</a>` : '';
        const respuestaHTML = r.Respuesta_Admin ? `<br><small class="text-muted"><b>Respuesta:</b> ${escaparHTMLAdmin(r.Respuesta_Admin)}</small>` : '';
        const badgeEstado = String(r.estado).toLowerCase() === 'resuelto' ? 'bg-success' : 'bg-warning text-dark';

        tbody.innerHTML += `
            <tr>
                <td class="fw-bold text-muted">#${idReporte}</td>
                <td>${idElemento}<br><small class="text-muted">Usuario #${escaparHTMLAdmin(r.Id_Usuario)}</small></td>
                <td>${motivo}${evidenciaHTML}${respuestaHTML}</td>
                <td><span class="badge ${badgeEstado}">${estado}</span></td>
                <td class="text-end">
                    <button class="btn btn-sm btn-primary fw-bold me-1" onclick="abrirModalRespuesta('${idReporte}')">✏️ Ver / Responder</button>
                    <button class="btn btn-sm btn-outline-danger fw-bold" onclick="eliminarReporte('${idReporte}')">🗑️</button>
                </td>
            </tr>
        `;
    });
}

async function cargarTablaReportes() {
    const tbody = document.getElementById('tablaReportes');
    try {
        const res = await fetch(`${API_BASE}/reporte`, { 
            headers: { 'Authorization': `Bearer ${tokenGlobal}` }
        });
        
        if (res.ok) {
            const respuesta = await res.json();
            const reportes = respuesta.data || respuesta || [];
            renderizarFilasReportes(reportes);
            cargarEstadisticasReportes();
        } else {
            document.getElementById('statReportes').innerText = "0";
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No se encontró la ruta de reportes.</td></tr>';
        }
    } catch (e) {
        document.getElementById('statReportes').innerText = "--";
        tbody.innerHTML = '<tr><td colspan="5" class="text-danger text-center">Error al conectar con reportes</td></tr>';
    }
}

async function filtrarReportesAdmin() {
    const estado = document.getElementById('filtroEstadoReporte').value;
    const Tipo_Referencia = document.getElementById('filtroTipoReporte').value;
    const Id_Usuario = document.getElementById('filtroUsuarioReporte').value.trim();
    const fecha_inicio = document.getElementById('filtroFechaInicioReporte').value;
    const fecha_fin = document.getElementById('filtroFechaFinReporte').value;

    const filtros = {};
    if (estado) filtros.estado = estado;
    if (Tipo_Referencia) filtros.Tipo_Referencia = Tipo_Referencia;
    if (Id_Usuario) filtros.Id_Usuario = Number(Id_Usuario);
    if (fecha_inicio && fecha_fin) {
        filtros.fecha_inicio = fecha_inicio;
        filtros.fecha_fin = fecha_fin;
    }

    const tbody = document.getElementById('tablaReportes');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Filtrando reportes...</td></tr>';

    try {
        const res = await filtrarReportesApi(filtros);
        if (res.status === 200 && Array.isArray(res.data)) {
            renderizarFilasReportes(res.data);
        } else {
            tbody.innerHTML = '<tr><td colspan="5" class="text-danger text-center">No se pudieron filtrar los reportes.</td></tr>';
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-danger text-center">Error al filtrar reportes.</td></tr>';
    }
}

function limpiarFiltrosReportesAdmin() {
    document.getElementById('filtroEstadoReporte').value = '';
    document.getElementById('filtroTipoReporte').value = '';
    document.getElementById('filtroUsuarioReporte').value = '';
    document.getElementById('filtroFechaInicioReporte').value = '';
    document.getElementById('filtroFechaFinReporte').value = '';
    cargarTablaReportes();
}

async function eliminarReporte(id) {
    if(confirm("¿Eliminar este reporte del sistema?")) {
        try {
            const res = await fetch(`${API_BASE}/reporte/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${tokenGlobal}` }
            });
            if (res.ok) cargarTablaReportes();
            else alert("Error al eliminar el reporte.");
        } catch(e) { alert("Error de conexión"); }
    }
}

// Abre la ventana y consulta GET /api/reporte/:id para mostrar el detalle completo
async function abrirModalRespuesta(id) {
    document.getElementById('reporteIdActual').value = id;
    document.getElementById('respuestaAdminTexto').value = '';
    const detalleDiv = document.getElementById('detalleReporteModal');
    if (detalleDiv) {
        detalleDiv.innerHTML = 'Cargando detalles del reporte...';
    }

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalResponderReporte'));
    modal.show();

    try {
        const res = await obtenerReportePorIdApi(id);
        if (res.status === 200 && res.data) {
            const r = res.data;
            document.getElementById('respuestaAdminTexto').value = r.Respuesta_Admin || '';
            if (detalleDiv) {
                const fechaStr = r.fecha_Reporte ? new Date(r.fecha_Reporte).toLocaleString() : 'N/A';
                const imgHtml = r.Imagen
                    ? `<div class="mt-2"><a href="${escaparHTMLAdmin(r.Imagen)}" target="_blank" rel="noopener noreferrer" class="fw-bold text-primary text-decoration-none">📷 Abrir imagen de evidencia</a></div>`
                    : '';
                detalleDiv.innerHTML = `
                    <div><strong>Reporte #${escaparHTMLAdmin(r.id_Reporte)}</strong> — <span class="badge ${String(r.estado).toLowerCase() === 'resuelto' ? 'bg-success' : 'bg-warning text-dark'}">${escaparHTMLAdmin(r.estado)}</span></div>
                    <div class="mt-1"><strong>Referencia:</strong> ${escaparHTMLAdmin(r.Tipo_Referencia)} #${escaparHTMLAdmin(r.Id_Referencia)} (Reportado por Usuario #${escaparHTMLAdmin(r.Id_Usuario)})</div>
                    <div class="mt-1"><strong>Fecha:</strong> ${escaparHTMLAdmin(fechaStr)}</div>
                    <div class="mt-1"><strong>Motivo:</strong> ${escaparHTMLAdmin(r.motivo)}</div>
                    ${imgHtml}
                `;
            }
        }
    } catch (e) {
        if (detalleDiv) detalleDiv.innerHTML = 'No se pudo cargar el detalle del reporte.';
    }
}

// Procesa el reporte dependiendo de si elegiste "Responder" o "Resolver"
async function procesarReporte(accion) {
    const id = document.getElementById('reporteIdActual').value;
    const respuestaTexto = document.getElementById('respuestaAdminTexto').value.trim();
    
    const btnResponder = document.getElementById('btnSoloResponder');
    const btnResolver = document.getElementById('btnResolver');

    let datosParaEnviar = {};

    if (accion === 'responder') {
        if (!respuestaTexto) {
            alert("Para enviar una respuesta, primero debes escribir un mensaje.");
            return;
        }
        datosParaEnviar = { Respuesta_Admin: respuestaTexto };
        
    } else if (accion === 'resolver') {
        datosParaEnviar = { estado: 'Resuelto' };
        if (respuestaTexto) {
            datosParaEnviar.Respuesta_Admin = respuestaTexto;
        }
    }

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
        btnResponder.disabled = false;
        btnResolver.disabled = false;
    }
}