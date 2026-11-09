// js/api.js

// URL base de tu backend en Node.js
const API_URL = 'https://brookinodejs.onrender.com/api';

// Utilidad para sanitizar texto y prevenir XSS al usar innerHTML
function escaparHTML(texto) {
    if (texto === null || texto === undefined) return '';
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Función genérica para hacer Login
async function peticionLogin(correo, contrasena) {
    try {
        const respuesta = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Correo: correo,
                Contrasena: contrasena
            })
        });

        // Convertimos la respuesta a JSON
        const data = await respuesta.json();
        
        // Retornamos el status HTTP y los datos para manejarlos en login.js
        return { status: respuesta.status, data };

    } catch (error) {
        console.error("Error al conectar con la API:", error);
        return { status: 500, data: { mensaje: "Error de conexión con el servidor" } };
    }
}

// Función para traer las publicaciones del Muro
// Reintenta si el servidor de Render está "despertando" (plan gratuito) o hay fallo de red
async function obtenerPublicaciones(intentos = 4, filtros = {}) {
    const token = localStorage.getItem('token');
    let ultimo = { status: 0, data: { mensaje: "Error de conexión" } };

    for (let i = 0; i < intentos; i++) {
        const controlador = new AbortController();
        const temporizador = setTimeout(() => controlador.abort(), 30000); // 30 s por intento

        try {
            const respuesta = await fetch(`${API_URL}/publicacion/buscar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ limit: 100, ...filtros }),
                signal: controlador.signal
            });
            clearTimeout(temporizador);

            let data = {};
            try { data = await respuesta.json(); } catch (e) { }
            ultimo = { status: respuesta.status, data };

            // Solo reintentamos si el servidor está dormido/caído (502, 503, 504)
            if (![502, 503, 504].includes(respuesta.status)) return ultimo;

        } catch (error) {
            clearTimeout(temporizador);
            console.warn(`Intento ${i + 1} fallido al obtener publicaciones:`, error);
            ultimo = { status: 0, data: { mensaje: "Error de conexión" } };
        }

        if (i < intentos - 1) await new Promise(r => setTimeout(r, 3000));
    }
    return ultimo;
}

// Función para dar o quitar Like
async function toggleLikeApi(idPublicacion) {
    const token = localStorage.getItem('token');
    
    try {
        const respuesta = await fetch(`${API_URL}/publicacion/${idPublicacion}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await respuesta.json();
        return { status: respuesta.status, data };

    } catch (error) {
        console.error("Error al procesar el Like:", error);
        return { status: 500, data: { mensaje: "Error de conexión" } };
    }
}

// Función para obtener la lista de productos
async function obtenerListaProductos() {
    try {
        const respuesta = await fetch(`${API_URL}/productos`); // Hacemos un GET a la tabla de productos
        const data = await respuesta.json();
        return { status: respuesta.status, data };
    } catch (error) {
        console.error("Error al obtener productos:", error);
        return { status: 500, data: { mensaje: "Error de conexión" } };
    }
}

// 1. LA QUE TE FALTA: Función para crear el texto de la publicación
async function crearPublicacionApi(titulo, contenido, idProducto) {
    const token = localStorage.getItem('token');
    
    try {
        const respuesta = await fetch(`${API_URL}/publicacion`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                Titulo: titulo,
                Contenido: contenido,
                Id_Producto: idProducto
            })
        });

        const data = await respuesta.json();
        return { status: respuesta.status, data };
    } catch (error) {
        console.error("Error al crear publicación:", error);
        return { status: 500, data: { mensaje: "Error de conexión" } };
    }
}

// 2. LA QUE ACABAMOS DE HACER: Función para subir la imagen
async function subirImagenApi(idPublicacion, archivoImagen) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('foto', archivoImagen); 

    try {
        const respuesta = await fetch(`${API_URL}/publicacion/${idPublicacion}/imagen`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await respuesta.json();
        return { status: respuesta.status, data };
    } catch (error) {
        console.error("Error al subir imagen:", error);
        return { status: 500, data: { mensaje: "Error de conexión con el servidor de imágenes" } };
    }
}

async function publicarComentarioApi(idPublicacion, contenido) {
    const token = localStorage.getItem('token');
    try {
        // Ajustamos la URL según tus rutas: /api/mensajes/PUB-001
        const respuesta = await fetch(`${API_URL}/mensajes/${idPublicacion}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ Contenido: contenido }) // Mandamos 'Contenido' con C mayúscula
        });
        const data = await respuesta.json();
        return { status: respuesta.status, data };
    } catch (error) {
        return { status: 500, data: { mensaje: "Error de conexión" } };
    }
}

// Función para EDITAR una publicación
async function editarPublicacionApi(idPublicacion, titulo, contenido) {
    const token = localStorage.getItem('token');
    try {
        const respuesta = await fetch(`${API_URL}/publicacion/${idPublicacion}`, {
            method: 'PUT', // Método para actualizar
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                Titulo: titulo,
                Contenido: contenido
            })
        });
        const data = await respuesta.json();
        return { status: respuesta.status, data };
    } catch (error) {
        console.error("Error al editar publicación:", error);
        return { status: 500, data: { mensaje: "Error de conexión" } };
    }
}

// 1. Crear el reporte genérico
async function reportarApi(idReferencia, tipoReferencia, motivoTexto) {
    const token = localStorage.getItem('token');
    try {
        const respuesta = await fetch(`${API_URL}/reporte`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                motivo: motivoTexto,
                Tipo_Referencia: tipoReferencia, // Puede ser 'Publicacion' o 'Mensaje'
                Id_Referencia: idReferencia
            })
        });
        const data = await respuesta.json();
        return { status: respuesta.status, data };
    } catch (error) {
        return { status: 500, data: { mensaje: "Error de conexión" } };
    }
}

// 2. Subir la evidencia
async function subirImagenReporteApi(idReporte, archivoImagen) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('foto', archivoImagen); 

    try {
        const respuesta = await fetch(`${API_URL}/reporte/${idReporte}/imagen`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        const data = await respuesta.json();
        return { status: respuesta.status, data };
    } catch (error) {
        return { status: 500, data: { mensaje: "Error al subir la imagen" } };
    }
}

// Actualizar datos del usuario (Nombre, Contraseña)
async function actualizarUsuarioApi(idUsuario, datos) {
    const token = localStorage.getItem('token');
    try {
        const respuesta = await fetch(`${API_URL}/usuario/${idUsuario}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(datos)
        });
        const data = await respuesta.json();
        return { status: respuesta.status, data };
    } catch (error) {
        return { status: 500, data: { mensaje: "Error de conexión" } };
    }
}

// Subir foto de perfil
async function subirFotoPerfilApi(idUsuario, archivoImagen) {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('foto', archivoImagen); 

    try {
        // CORREGIDO: Usamos /foto en lugar de /imagen
        const respuesta = await fetch(`${API_URL}/usuario/${idUsuario}/foto`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        const data = await respuesta.json();
        return { status: respuesta.status, data };
    } catch (error) {
        return { status: 500, data: { mensaje: "Error al subir la imagen" } };
    }
}

// Verificar sesión activa (GET /api/auth/perfil)
async function verificarPerfilAuthApi() {
    const token = localStorage.getItem('token');
    try {
        const respuesta = await fetch(`${API_URL}/auth/perfil`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await respuesta.json();
        return { status: respuesta.status, data };
    } catch (error) {
        return { status: 500, data: { mensaje: "Error de conexión" } };
    }
}

// Obtener usuario por ID (GET /api/usuario/:id)
async function obtenerUsuarioPorIdApi(idUsuario) {
    const token = localStorage.getItem('token');
    try {
        const respuesta = await fetch(`${API_URL}/usuario/${idUsuario}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await respuesta.json();
        return { status: respuesta.status, data };
    } catch (error) {
        return { status: 500, data: { mensaje: "Error de conexión" } };
    }
}

// Buscar usuario por correo (GET /api/usuario/correo/:correo) - Admin
async function obtenerUsuarioPorCorreoApi(correo) {
    const token = localStorage.getItem('token');
    try {
        const respuesta = await fetch(`${API_URL}/usuario/correo/${encodeURIComponent(correo)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await respuesta.json();
        return { status: respuesta.status, data };
    } catch (error) {
        return { status: 500, data: { mensaje: "Error de conexión" } };
    }
}

// Obtener producto por ID (GET /api/productos/:id)
async function obtenerProductoPorIdApi(idProducto) {
    try {
        const respuesta = await fetch(`${API_URL}/productos/${idProducto}`);
        const data = await respuesta.json();
        return { status: respuesta.status, data };
    } catch (error) {
        return { status: 500, data: { mensaje: "Error de conexión" } };
    }
}

// Actualizar producto (PUT /api/productos/:id)
async function actualizarProductoApi(idProducto, datos) {
    const token = localStorage.getItem('token');
    try {
        const respuesta = await fetch(`${API_URL}/productos/${idProducto}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(datos)
        });
        const data = await respuesta.json();
        return { status: respuesta.status, data };
    } catch (error) {
        return { status: 500, data: { mensaje: "Error de conexión" } };
    }
}

// Obtener comentarios y respuestas de una publicación (GET /api/mensajes/:idPublicacion)
async function obtenerMensajesApi(idPublicacion) {
    const token = localStorage.getItem('token');
    try {
        const respuesta = await fetch(`${API_URL}/mensajes/${idPublicacion}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await respuesta.json();
        return { status: respuesta.status, data };
    } catch (error) {
        return { status: 500, data: { mensaje: "Error de conexión" } };
    }
}

// Responder a un comentario (POST /api/mensajes/:idPublicacion/:idMensaje)
async function responderComentarioApi(idPublicacion, idMensaje, comentario) {
    const token = localStorage.getItem('token');
    try {
        const respuesta = await fetch(`${API_URL}/mensajes/${idPublicacion}/${idMensaje}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ Comentario: comentario })
        });
        const data = await respuesta.json();
        return { status: respuesta.status, data };
    } catch (error) {
        return { status: 500, data: { mensaje: "Error de conexión" } };
    }
}

// Estadísticas de reportes (GET /api/reporte/estadisticas) - Admin
async function obtenerEstadisticasReportesApi() {
    const token = localStorage.getItem('token');
    try {
        const respuesta = await fetch(`${API_URL}/reporte/estadisticas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await respuesta.json();
        return { status: respuesta.status, data };
    } catch (error) {
        return { status: 500, data: { mensaje: "Error de conexión" } };
    }
}

// Obtener reporte por ID (GET /api/reporte/:id) - Admin
async function obtenerReportePorIdApi(idReporte) {
    const token = localStorage.getItem('token');
    try {
        const respuesta = await fetch(`${API_URL}/reporte/${idReporte}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await respuesta.json();
        return { status: respuesta.status, data };
    } catch (error) {
        return { status: 500, data: { mensaje: "Error de conexión" } };
    }
}

// Filtrar reportes (POST /api/reporte/filtrar) - Admin
async function filtrarReportesApi(filtros) {
    const token = localStorage.getItem('token');
    try {
        const respuesta = await fetch(`${API_URL}/reporte/filtrar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(filtros)
        });
        const data = await respuesta.json();
        return { status: respuesta.status, data };
    } catch (error) {
        return { status: 500, data: { mensaje: "Error de conexión" } };
    }
}
