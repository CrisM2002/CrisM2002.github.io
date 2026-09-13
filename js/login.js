// js/login.js

document.getElementById('formLogin').addEventListener('submit', async function(event) {
    // Evita que la página se recargue (comportamiento por defecto de HTML)
    event.preventDefault();

    // 1. Obtenemos los valores de los inputs
    const correo = document.getElementById('inputCorreo').value;
    const contrasena = document.getElementById('inputContrasena').value;
    
    // Elementos de la interfaz (Botón y Alerta)
    const btnSubmit = document.getElementById('btnSubmit');
    const alertaError = document.getElementById('alertaError');

    // 2. Preparamos la interfaz (Mostramos que está cargando)
    btnSubmit.disabled = true;
    btnSubmit.innerText = "Verificando...";
    alertaError.classList.add('d-none'); // Ocultamos errores previos

    // 3. Llamamos a nuestra función de api.js
    const respuesta = await peticionLogin(correo, contrasena);

    // 4. Analizamos la respuesta del servidor
    if (respuesta.status === 200 && respuesta.data.token) {
        // ¡LOGIN EXITOSO!
        // Guardamos el token en el LocalStorage del navegador
        localStorage.setItem('token', respuesta.data.token);
        
        // (Opcional) Podemos guardar datos del usuario para mostrarlos en el menú
        localStorage.setItem('usuario', JSON.stringify(respuesta.data.usuario));

        // Redirigimos al muro principal
        window.location.href = 'index.html';
    } else {
        // ERROR (Contraseña incorrecta, no existe, etc.)
        alertaError.innerText = respuesta.data.mensaje || "Error al iniciar sesión";
        alertaError.classList.remove('d-none');
        
        // Restauramos el botón
        btnSubmit.disabled = false;
        btnSubmit.innerText = "Iniciar Sesión";
    }
});

async function solicitarRecuperacion() {
    const correoInput = document.getElementById('correoRecuperar').value.trim();
    if (!correoInput) {
        alert("Por favor, ingresa un correo electrónico.");
        return;
    }

    const btn = document.getElementById('btnEnviarRecuperacion');
    btn.disabled = true;
    btn.innerText = "Enviando correo...";

    try {
        const respuesta = await fetch('https://brookinodejs.onrender.com/api/auth/recuperar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo: correoInput })
        });
        const data = await respuesta.json();

        if (respuesta.status === 200) {
            alert("¡Éxito! " + data.mensaje);
            // Cerramos el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalRecuperar'));
            modal.hide();
        } else {
            alert("Atención: " + data.mensaje);
        }
    } catch (error) {
        alert("Error de conexión con el servidor.");
    } finally {
        btn.disabled = false;
        btn.innerText = "Enviar Enlace";
    }
}