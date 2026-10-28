// js/login.js — envía el formulario de login a api/login.php
const formulario = document.getElementById("form-login");
const mensaje = document.getElementById("mensaje");

// ¿A qué página volver después del login? Viene en la URL: login.html?volver=financiacion.html
// Solo aceptamos nombres de páginas de este sitio ("algo.html"), nunca otra dirección,
// para que nadie arme un enlace que mande a los usuarios a un sitio falso.
const volver = new URLSearchParams(window.location.search).get("volver") ?? "";
const destinoValido = /^[\w-]+\.html(\?[\w=&%-]*)?$/.test(volver);

// El enlace "Registrate" conserva el ?volver=, así después del registro también se vuelve
document.querySelector(".acceso > p a").href = "registro.html" + window.location.search;

// Enviar email y contraseña a la API
formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault(); // evita que el navegador recargue la página
  mensaje.textContent = "Verificando…";

  try {
    const respuesta = await fetch("api/login.php", {
      method: "POST",
      body: new FormData(formulario),
    });
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      mensaje.textContent = datos.error; // ej.: "Email o contraseña incorrectos."
      return;
    }

    if (destinoValido) {
      window.location.href = volver; // vuelve a la página donde estaba
    } else {
      // Sin página de origen: el administrador va al panel; un cliente, al inicio
      window.location.href = datos.rol === "admin" ? "panel.html" : "index.html";
    }
  } catch (error) {
    console.error(error);
    mensaje.textContent = "No se pudo conectar con el servidor.";
  }
});
