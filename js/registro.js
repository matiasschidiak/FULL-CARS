// js/registro.js — envía el formulario de registro a api/registro.php
const formulario = document.getElementById("form-registro");
const mensaje = document.getElementById("mensaje");

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensaje.textContent = "Creando cuenta…";

  try {
    const respuesta = await fetch("api/registro.php", {
      method: "POST",
      body: new FormData(formulario),
    });
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      mensaje.textContent = datos.error; // ej.: "Ese email ya está registrado."
      return;
    }

    alert(datos.mensaje);
    // window.location.search conserva el ?volver= (si vino desde financiación, vuelve ahí)
    window.location.href = "login.html" + window.location.search;
  } catch (error) {
    console.error(error);
    mensaje.textContent = "No se pudo conectar con el servidor.";
  }
});
