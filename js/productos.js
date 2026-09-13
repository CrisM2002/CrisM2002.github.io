const API_PRODUCTOS = 'https://brookinodejs.onrender.com/api/productos';

document.addEventListener('DOMContentLoaded', () => {
    
    // --- NUEVO: Actualizar el letrero azul ---
    let usuarioStorage = {};
    try { 
        usuarioStorage = JSON.parse(localStorage.getItem('usuario')) || {}; 
    } catch(e) {}
    
    // Tomamos el rol (soportando mayúsculas o minúsculas)
    const rolUsuario = usuarioStorage.Rol || usuarioStorage.rol || 'Vendedor';
    const badge = document.getElementById('badgeRol');
    
    if (badge) {
        badge.innerText = `MODO: ${String(rolUsuario).toUpperCase()}`;
    }
    // ------------------------------------------

    // Escuchar el botón para abrir el Modal (Esto ya lo tienes)
    const btnNuevo = document.getElementById('btnNuevoProducto');
    if (btnNuevo) {
        btnNuevo.addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('modalNuevoProducto'));
            modal.show();
        });
    }

    // Iniciar la carga (Esto ya lo tienes)
    if (typeof cargarProductos === 'function') {
        cargarProductos();
    }
});

function verificarPermisos() {
    const token = localStorage.getItem('token');
    let usuario = {};
    
    try {
        usuario = JSON.parse(localStorage.getItem('usuario')) || {};
    } catch (e) { }

    // Si no hay token o no hay usuario en memoria, al login
    if (!token || !usuario.rol) {
        window.location.href = 'login.html';
        return;
    }

    // EL GUARDIÁN: Validamos que el rol sea Vendedor o admin (Ojo a las mayúsculas/minúsculas)
    const rolActual = usuario.rol.toLowerCase();
    if (rolActual !== 'vendedor' && rolActual !== 'admin') {
        alert("Acceso denegado: Esta sección es exclusiva para Vendedores y Administradores.");
        window.location.href = 'index.html'; // Lo pateamos al muro
        return;
    }

    // Si   pasó la prueba, le mostramos su rol en la pantalla
    document.getElementById('badgeRol').innerText = `MODO: ${usuario.rol.toUpperCase()}`;
}

async function cargarProductos() {
    const contenedor = document.getElementById('contenedorProductos');
    const token = localStorage.getItem('token');
    
    // 1. Rescatamos los datos del usuario de la memoria
    let usuario = {};
    try { usuario = JSON.parse(localStorage.getItem('usuario')) || {}; } catch(e) {}
    
    // Normalizamos el rol a minúsculas
    const rolActual = String(usuario.Rol || usuario.rol || '').toLowerCase();
    
    // De tu consola vimos que el ID se guarda como 'id'
    const idUsuario = usuario.id || usuario.Id_Usuario; 

    // 2. EL CEREBRO DE LA OPERACIÓN: Elegimos la ruta
    let urlDestino = API_PRODUCTOS; // Por defecto (Admin), pide todos los productos
    
    if (rolActual === 'vendedor') {
        // Si es vendedor, usamos tu ruta específica para que solo traiga los suyos
        urlDestino = `${API_PRODUCTOS}/usuario/${idUsuario}`;
    }

    try {
        const res = await fetch(urlDestino, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.status === 200) {
            const productos = await res.json();
            contenedor.innerHTML = '';
            
            if (productos.length === 0) {
                contenedor.innerHTML = '<p class="text-center text-muted w-100 py-5">No tienes productos en tu tienda aún.</p>';
                return;
            }

            // Dibujar cada producto
            productos.forEach(prod => {
                const statusBadge = prod.Disponible ? '<span class="badge bg-success">Disponible</span>' : '<span class="badge bg-danger">Agotado</span>';
                
                contenedor.innerHTML += `
                    <div class="col-md-4 mb-4">
                        <div class="card border-0 shadow-sm h-100" style="border-radius: 16px;">
                            <div class="card-body">
                                <div class="d-flex justify-content-between mb-2">
                                    <h5 class="fw-bold text-dark mb-0">${prod.nombre_Producto}</h5>
                                    ${statusBadge}
                                </div>
                                <h4 class="text-primary fw-bold mb-3">$${prod.Precio}</h4>
                                <p class="text-muted small">${prod.Descripcion}</p>
                            </div>
                            <div class="card-footer bg-white border-0 pt-0 pb-3 text-end">
                                <button class="btn btn-sm btn-outline-danger rounded-pill px-3 fw-bold" onclick="eliminarProducto('${prod.Id_Producto}')">🗑️ Eliminar</button>
                            </div>
                        </div>
                    </div>
                `;
            });
        }
    } catch (error) {
        contenedor.innerHTML = '<p class="text-danger text-center w-100">Error al conectar con la base de datos.</p>';
    }
}

async function guardarProducto() {
    const btnGuardar = document.getElementById('btnGuardarProd');
    const nombre = document.getElementById('prodNombre').value.trim();
    const desc = document.getElementById('prodDesc').value.trim();
    const precio = document.getElementById('prodPrecio').value;
    const disponible = document.getElementById('prodDisponible').checked ? 1 : 0;
    
    // Obtenemos la fecha actual para MySQL (Formato YYYY-MM-DD)
    const fecha = new Date().toISOString().split('T')[0];

    if (!nombre || !desc || !precio) {
        alert("Por favor, llena todos los campos.");
        return;
    }

    btnGuardar.disabled = true;
    btnGuardar.innerText = "Guardando...";

    const datos = {
        nombre_Producto: nombre,
        Descripcion: desc,
        Precio: precio,
        Disponible: disponible,
        fecha_Publicacion: fecha
    };

    const token = localStorage.getItem('token');
    
    try {
        const res = await fetch(API_PRODUCTOS, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(datos)
        });

        if (res.status === 201) {
            // Éxito: Ocultar modal, limpiar form y recargar
            const modalElement = document.getElementById('modalNuevoProducto');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            modalInstance.hide();
            
            document.getElementById('formProducto').reset();
            cargarProductos(); 
        } else {
            const error = await res.json();
            alert("Error: " + error.mensaje);
        }
    } catch(e) {
        alert("Error de conexión al servidor.");
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerText = "Guardar";
    }
}

async function eliminarProducto(id) {
    if(confirm("¿Seguro que deseas eliminar este producto de la tienda?")) {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_PRODUCTOS}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.status === 200) {
            cargarProductos(); // Refrescar la pantalla
        } else {
            const error = await res.json();
            // Tu API bloquea a quien no sea el dueño, aquí mostramos ese mensaje
            alert("Atención: " + (error.mensaje || "No se pudo eliminar"));
        }
    }
}