// js/registro.js
const API_URL = 'https://brookinodejs.onrender.com/api'; // Ajusta esto a la URL de tu backend si es diferente

document.getElementById('formRegistro').addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita que la página se recargue
    
    const btnRegistrar = document.getElementById('btnRegistrar');
    btnRegistrar.disabled = true;
    btnRegistrar.innerText = "Creando cuenta...";

    const datosRegistro = {
        nombre_Usuario: document.getElementById('regNombreUsuario').value.trim(),
        nombre_Completo: document.getElementById('regNombreCompleto').value.trim(),
        Correo: document.getElementById('regCorreo').value.trim(),
        Contrasena: document.getElementById('regContrasena').value.trim(),
        Rol: document.getElementById('regRol').value
    };

    try {
        // Asegúrate de que la ruta sea /usuario o /usuarios dependiendo de tu app.js en Node
        const respuesta = await fetch(`${API_URL}/usuario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosRegistro)
        });

        const data = await respuesta.json();

        if (respuesta.status === 201 || respuesta.status === 200) {
            alert("¡Cuenta creada con éxito! Ahora puedes iniciar sesión.");
            window.location.href = 'login.html'; // Lo mandamos al login
        } else {
            alert("Error al registrar: " + (data.mensaje || "Intenta de nuevo"));
            btnRegistrar.disabled = false;
            btnRegistrar.innerText = "Registrarse →";
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error de conexión con el servidor.");
        btnRegistrar.disabled = false;
        btnRegistrar.innerText = "Registrarse →";
    }
});