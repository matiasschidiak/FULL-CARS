// js/turnos.js — la información es pública, pero reservar pide sesión.
// Usa sesionUsuario, que viene de js/sesion.js (se carga antes que este archivo).

const formTurno = document.getElementById("form-turno");
const mensajeTurno = document.getElementById("mensaje-turno");
const campoFecha = document.getElementById("fecha");
const campoHora = document.getElementById("hora");
const campoVehiculo = document.getElementById("vehiculo_id");

// Si se llega desde un auto (turnos.html?vehiculo=2), lo dejamos elegido
const vehiculoDeLaUrl = new URLSearchParams(window.location.search).get("vehiculo") ?? "";

// "2026-11-05" → "jueves 5 de noviembre"
const formatoDia = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" });
// Fecha larga con la primera letra en mayúscula
function fechaLarga(fechaTexto) {
  const texto = formatoDia.format(new Date(fechaTexto + "T00:00"));
  return texto.charAt(0).toUpperCase() + texto.slice(1); // "jueves" → "Jueves"
}

// Fecha de hoy + N días, en el formato del <input type="date">: "2026-11-05"
function fechaEnDias(dias) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  // sv-SE escribe las fechas como AAAA-MM-DD, justo el formato que necesitamos
  return fecha.toLocaleDateString("sv-SE");
}

// Llena el <select> de autos con los de la base
async function cargarVehiculosEnSelect() {
  try {
    const vehiculos = await fetch("api/vehiculos.php").then((r) => r.json());
    vehiculos.forEach((v) => {
      const opcion = document.createElement("option");
      opcion.value = v.id;
      opcion.textContent = v.marca + " " + v.modelo + " (" + v.anio + ")";
      campoVehiculo.appendChild(opcion);
    });
    campoVehiculo.value = vehiculoDeLaUrl;
    // Si ese id no está en la lista, el select queda sin nada elegido: volvemos a "Ninguno"
    if (campoVehiculo.selectedIndex === -1) campoVehiculo.value = "";
  } catch (error) {
    console.error(error); // sin la lista igual se puede reservar
  }
}

// Al elegir una fecha, pide a la API los horarios libres de ese día
async function cargarHorarios() {
  campoHora.disabled = true;
  campoHora.replaceChildren(new Option("Buscando horarios…", ""));
  if (!campoFecha.value) {
    campoHora.replaceChildren(new Option("Primero elegí una fecha", ""));
    return;
  }

  try {
    const respuesta = await fetch("api/horarios.php?fecha=" + encodeURIComponent(campoFecha.value));
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      campoHora.replaceChildren(new Option(datos.error, ""));
      return;
    }
    if (datos.horarios.length === 0) {
      campoHora.replaceChildren(new Option("No hay horarios libres ese día", ""));
      return;
    }

    campoHora.replaceChildren(new Option("Elegí un horario", ""));
    datos.horarios.forEach((hora) => campoHora.appendChild(new Option(hora + " hs", hora)));
    campoHora.disabled = false;
  } catch (error) {
    console.error(error);
    campoHora.replaceChildren(new Option("No se pudieron cargar los horarios", ""));
  }
}

// Muestra los próximos turnos del usuario
async function cargarMisTurnos() {
  const lista = document.getElementById("lista-mis-turnos");
  try {
    const turnos = await fetch("api/mis_turnos.php").then((r) => r.json());
    document.getElementById("mis-turnos").hidden = turnos.length === 0;
    lista.replaceChildren();

    turnos.forEach((t) => {
      const item = document.createElement("li");
      if (t.estado === "cancelado") item.classList.add("turno-cancelado");

      const cuando = document.createElement("strong");
      cuando.textContent = fechaLarga(t.fecha) + ", " + t.hora + " hs";

      const detalle = document.createElement("span");
      detalle.textContent = t.motivo + (t.marca ? " · " + t.marca + " " + t.modelo : "");

      const estado = document.createElement("span");
      estado.classList.add("estado", "estado-" + t.estado);
      estado.textContent = t.estado.charAt(0).toUpperCase() + t.estado.slice(1); // "Pendiente"

      item.append(cuando, detalle, estado);

      // Botón "Cancelar turno": solo si no está cancelado y todavía no pasó
      // (la API vuelve a controlar las dos cosas)
      const yaPaso = new Date(t.fecha + "T" + t.hora) <= new Date();
      if (t.estado !== "cancelado" && !yaPaso) {
        const cancelar = document.createElement("button");
        cancelar.type = "button";
        cancelar.classList.add("btn-chico", "btn-peligro");
        cancelar.textContent = "Cancelar turno";
        cancelar.addEventListener("click", () => cancelarMiTurno(t));
        item.appendChild(cancelar);
      }

      lista.appendChild(item);
    });
  } catch (error) {
    console.error(error);
  }
}

// El cliente cancela uno de sus turnos
async function cancelarMiTurno(turno) {
  const cuando = fechaLarga(turno.fecha) + ", " + turno.hora + " hs";
  if (!confirm("¿Cancelar tu turno del " + cuando + "?")) {
    return;
  }

  const datosEnvio = new FormData();
  datosEnvio.append("id", turno.id);

  try {
    const respuesta = await fetch("api/cancelar_mi_turno.php", { method: "POST", body: datosEnvio });
    const datos = await respuesta.json();

    document.getElementById("mensaje-mis-turnos").textContent = respuesta.ok ? datos.mensaje : datos.error;
    cargarMisTurnos();
    // Si el formulario muestra ese mismo día, actualizamos los horarios: el cancelado vuelve a estar libre
    if (campoFecha.value === turno.fecha) cargarHorarios();
  } catch (error) {
    console.error(error);
    alert("No se pudo conectar con el servidor.");
  }
}

// (El horario de atención lo muestra js/horario.js, compartido con contacto.html)

// Muestra el formulario o el aviso, según haya sesión
async function prepararPagina() {
  const usuario = await sesionUsuario;

  if (!usuario) {
    // Visitante: mostramos cómo ingresar, conservando el auto elegido para después del login
    const volver = encodeURIComponent("turnos.html" + window.location.search);
    document.getElementById("aviso-login").href = "login.html?volver=" + volver;
    document.getElementById("aviso-registro").href = "registro.html?volver=" + volver;
    document.getElementById("aviso-sesion").hidden = false;
    return;
  }

  // Con sesión: fechas permitidas de hoy a 60 días (la API vuelve a controlarlo)
  campoFecha.min = fechaEnDias(0);
  campoFecha.max = fechaEnDias(60);
  if (vehiculoDeLaUrl) document.getElementById("motivo").value = "Ver un vehículo";

  formTurno.hidden = false;
  cargarVehiculosEnSelect();
  cargarMisTurnos();
}

// Al cambiar la fecha, buscar sus horarios libres
campoFecha.addEventListener("change", cargarHorarios);

// Reservar el turno
formTurno.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const boton = formTurno.querySelector("button");
  boton.disabled = true;
  mensajeTurno.textContent = "Reservando…";

  try {
    const respuesta = await fetch("api/sacar_turno.php", {
      method: "POST",
      body: new FormData(formTurno),
    });
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      mensajeTurno.textContent = datos.error;
      if (respuesta.status === 409) cargarHorarios(); // alguien lo ganó: actualizamos la lista
      return;
    }

    mensajeTurno.textContent =
      datos.mensaje + " " + fechaLarga(campoFecha.value) + ", " + campoHora.value + " hs.";
    formTurno.reset();
    campoHora.replaceChildren(new Option("Primero elegí una fecha", ""));
    campoHora.disabled = true;
    cargarMisTurnos();
  } catch (error) {
    console.error(error);
    mensajeTurno.textContent = "No se pudo conectar con el servidor.";
  } finally {
    boton.disabled = false;
  }
});

prepararPagina();
