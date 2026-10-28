// js/financiacion.js — la información es pública, pero el formulario pide sesión.
// Usa sesionUsuario, que viene de js/sesion.js (se carga antes que este archivo).

const formFinanciacion = document.getElementById("form-financiacion");
const mensajeFinanciacion = document.getElementById("mensaje-financiacion");
const campoVehiculo = document.getElementById("vehiculo");

// Llena el desplegable con los autos publicados EN ESTE MOMENTO (los pide a la base)
async function cargarVehiculosEnSelect() {
  try {
    const respuesta = await fetch("api/vehiculos.php");
    if (!respuesta.ok) throw new Error("Error del servidor: " + respuesta.status);
    const vehiculos = await respuesta.json();

    vehiculos.forEach((v) => {
      // new Option(texto que se ve, valor que se envía): se envía el id del auto
      campoVehiculo.appendChild(new Option(v.marca + " " + v.modelo + " (" + v.anio + ")", v.id));
    });
  } catch (error) {
    console.error(error); // sin la lista igual se puede enviar la solicitud
  }
}

// Muestra el formulario o el aviso, según haya sesión
async function prepararFormulario() {
  const usuario = await sesionUsuario;

  if (!usuario) {
    // Visitante: en lugar del formulario, mostramos cómo ingresar
    document.getElementById("aviso-sesion").hidden = false;
    return;
  }

  // Con sesión: mostramos el formulario y completamos el nombre
  formFinanciacion.hidden = false;
  document.getElementById("nombre").value = usuario.nombre;
  cargarVehiculosEnSelect();
}

// Envía la solicitud a la API, que la guarda en la base
formFinanciacion.addEventListener("submit", async (evento) => {
  evento.preventDefault(); // evita que el navegador recargue la página
  const boton = formFinanciacion.querySelector("button");
  boton.disabled = true; // evita que se envíe dos veces por un doble clic
  mensajeFinanciacion.textContent = "Enviando…";

  try {
    const respuesta = await fetch("api/solicitar_financiacion.php", {
      method: "POST",
      body: new FormData(formFinanciacion),
    });
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      mensajeFinanciacion.textContent = datos.error;
      return;
    }

    mensajeFinanciacion.textContent = datos.mensaje;
    // Limpiamos todo menos el nombre, por si quiere enviar otra
    const nombre = document.getElementById("nombre").value;
    formFinanciacion.reset();
    document.getElementById("nombre").value = nombre;
  } catch (error) {
    console.error(error);
    mensajeFinanciacion.textContent = "No se pudo conectar con el servidor.";
  } finally {
    boton.disabled = false; // finally se ejecuta siempre: haya salido bien o mal
  }
});

prepararFormulario();
