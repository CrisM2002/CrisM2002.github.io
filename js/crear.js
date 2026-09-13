// js/crear.js

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Seguridad
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('btnCerrarSesion').addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'login.html';
    });

    // 2. Cargar los productos automáticamente al abrir la página
    await llenarSelectProductos();

    // 3. Lógica del formulario
    document.getElementById('formCrearPublicacion').addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const btnPublicar = document.getElementById('btnPublicar');
        btnPublicar.disabled = true;
        btnPublicar.innerText = "Publicando...";

        const titulo = document.getElementById('inputTitulo').value;
        const contenido = document.getElementById('inputContenido').value;
        
        // ¡Magia aquí! Leemos el select en lugar del input de texto
        const idProducto = document.getElementById('selectProducto').value;

        const respuesta = await crearPublicacionApi(titulo, contenido, idProducto);

        if (respuesta.status === 201) {
            const inputImagen = document.getElementById('inputImagen');
            
            // 1. Verificamos si el usuario seleccionó una foto
            if (inputImagen.files.length > 0) {
                btnPublicar.innerText = "Subiendo imagen...";
                const archivo = inputImagen.files[0];
                
                // 2. Necesitamos el ID de la publicación que el backend acaba de crear.
                // ⚠️ AQUÍ DEPENDE DE TU BACKEND: Revisa cómo te contesta Node.js cuando creas una publicación.
                // Usualmente viene adentro de respuesta.data (ej. respuesta.data.Id_Publicacion o respuesta.data.id)
                const idNuevaPublicacion = respuesta.data.Id_Publicacion || respuesta.data.id; 

                if (idNuevaPublicacion) {
                    const resImagen = await subirImagenApi(idNuevaPublicacion, archivo);
                    
                    if(resImagen.status !== 200 && resImagen.status !== 201) {
                        alert("La publicación se creó, pero la imagen falló: " + (resImagen.data.mensaje || "Error desconocido"));
                    }
                } else {
                    console.error("No se encontró el ID de la nueva publicación en la respuesta del backend:", respuesta.data);
                    alert("Se creó el texto, pero tu API no regresó el ID para subir la foto.");
                }
            }

            // 3. Terminamos y lo mandamos a ver su obra de arte
            window.location.href = 'index.html';

        } else {
            alert(respuesta.data.mensaje || "Error al crear la publicación");
            btnPublicar.disabled = false;
            btnPublicar.innerText = "Publicar en el Muro";
        }
    });
});

// Función extra para pintar las opciones
async function llenarSelectProductos() {
    const select = document.getElementById('selectProducto');
    const respuesta = await obtenerListaProductos();

    if (respuesta.status === 200) {
        const productos = respuesta.data;
        
        // Limpiamos el mensaje de "Cargando..."
        select.innerHTML = '<option value="" disabled selected>Elige un producto...</option>';
        
        // Recorremos los productos y creamos una opción por cada uno
        productos.forEach(prod => {
            // Ponemos el Id en el value (para la base de datos) y el nombre a la vista del usuario
            select.innerHTML += `<option value="${prod.Id_Producto}">${prod.nombre_Producto} - $${prod.Precio}</option>`;
        });
    } else {
        select.innerHTML = '<option value="" disabled selected>Error al cargar productos</option>';
    }
}