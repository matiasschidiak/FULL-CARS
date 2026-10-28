// js/contacto.js — envía el formulario de Contacto a la API (cualquiera puede enviarlo).
// Usa sesionUsuario, que viene de js/sesion.js (se carga antes que este archivo).

const formConsulta = document.getElementById("form-consulta");
const mensajeConsulta = document.getElementById("mensaje-consulta");

// Si tiene sesión, le completamos nombre y email (los puede cambiar igual)
async function completarConSesion() {
  const usuario = await sesionUsuario;
  if (!usuario) return;
  document.getElementById("nombre").value = usuario.nombre;
  if (usuario.email) document.getElementById("email").value = usuario.email;
}

// Enviar la consulta a la API
formConsulta.addEventListener("submit", async (evento) => {
  evento.preventDefault(); // antes, el navegador ponía los datos en la dirección y no se guardaban
  const boton = formConsulta.querySelector("button");
  boton.disabled = true;
  mensajeConsulta.textContent = "Enviando…";

  try {
    const respuesta = await fetch("api/enviar_consulta.php", {
      method: "POST",
      body: new FormData(formConsulta),
    });
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      mensajeConsulta.textContent = datos.error;
      return;
    }

    mensajeConsulta.textContent = datos.mensaje;
    formConsulta.reset();
    completarConSesion(); // vuelve a poner nombre y email si tiene sesión
  } catch (error) {
    console.error(error);
    mensajeConsulta.textContent = "No se pudo conectar con el servidor.";
  } finally {
    boton.disabled = false;
  }
});

completarConSesion();
