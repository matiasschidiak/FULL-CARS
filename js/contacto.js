// js/contacto.js — el formulario de Contacto abre WhatsApp con el mensaje del cliente.
// No se guarda nada en la base: la consulta llega directo al WhatsApp de Full Cars.
// Usa sesionUsuario, que viene de js/sesion.js (se carga antes que este archivo).

// WhatsApp de Full Cars (+54 299 415-4002) en el formato de wa.me: 54 + 9 + número
const WHATSAPP_FULLCARS = "5492994154002";

const formConsulta = document.getElementById("form-consulta");
const mensajeConsulta = document.getElementById("mensaje-consulta");

// Si tiene sesión, le completamos nombre y email (los puede cambiar igual)
async function completarConSesion() {
  const usuario = await sesionUsuario;
  if (!usuario) return;
  document.getElementById("nombre").value = usuario.nombre;
  if (usuario.email) document.getElementById("email").value = usuario.email;
}

// Armar el mensaje con los datos del formulario y abrir WhatsApp
formConsulta.addEventListener("submit", (evento) => {
  evento.preventDefault(); // no se envía a ningún lado: solo abrimos WhatsApp

  const nombre = document.getElementById("nombre").value.trim();
  const email = document.getElementById("email").value.trim();
  const mensaje = document.getElementById("mensaje").value.trim();

  // Un renglón por dato; el email solo si lo completó
  let texto = "¡Hola Full Cars! Soy " + nombre + ".";
  if (email) texto += "\nEmail: " + email;
  texto += "\n\n" + mensaje;

  // encodeURIComponent: convierte espacios, tildes y saltos de línea al formato de una dirección
  const enlace = "https://wa.me/" + WHATSAPP_FULLCARS + "?text=" + encodeURIComponent(texto);
  window.open(enlace, "_blank", "noopener"); // abre WhatsApp en otra pestaña (o la app en el celular)

  mensajeConsulta.textContent = "Se abrió WhatsApp con tu mensaje: solo tenés que tocar Enviar.";
});

completarConSesion();
