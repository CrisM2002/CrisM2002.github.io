// js/api.js

// URL base de tu backend en Node.js
const API_URL = 'https://brookinodejs.onrender.com/api';

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
async function obtenerPublicaciones() {
    const token = localStorage.getItem('token');
    
    try {
        // Usamos la ruta de buscar (POST) enviando un body vacío para traer todo
        const respuesta = await fetch(`${API_URL}/publicacion/buscar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // ¡Aquí mandamos la llave!
            },
            body: JSON.stringify({}) // Body vacío para traer las más recientes
        });

        const data = await respuesta.json();
        return { status: respuesta.status, data };

    } catch (error) {
        console.error("Error al obtener publicaciones:", error);
        return { status: 500, data: { mensaje: "Error de conexión" } };
    }
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