// js/script.js — pide los vehículos a la API y dibuja las tarjetas.
// Se usa en index.html (destacados) y en vehiculos.html (catálogo completo).

// Formatos argentinos: 18500000 → "$ 18.500.000" y 65000 → "65.000"
const formatoPrecio = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});
const formatoNumero = new Intl.NumberFormat("es-AR");

// WhatsApp de Full Cars: +54 299 415-4002.
// Formato de wa.me: sin "+", espacios ni guiones, y con un 9 después del 54
// (los celulares de Argentina lo llevan para WhatsApp): 54 9 299 4154002
const WHATSAPP = "5492994154002";

// Muestra un aviso ocupando todo el contenedor
function mostrarMensaje(contenedor, texto) {
  const mensaje = document.createElement("p");
  mensaje.classList.add("mensaje");
  mensaje.textContent = texto;
  contenedor.replaceChildren(mensaje);
}

// Crea un elemento con su texto (atajo para no repetir 3 líneas cada vez)
function crearElemento(etiqueta, texto) {
  const elemento = document.createElement(etiqueta);
  elemento.textContent = texto;
  return elemento;
}

// Arma una vehiculo-card igual a las que estaban escritas a mano.
// compacta = true → versión del inicio (título h3 y datos en una línea)
function crearTarjeta(vehiculo, compacta) {
  const nombre = vehiculo.marca + " " + vehiculo.modelo;
  const kilometros = formatoNumero.format(vehiculo.kilometraje) + " km";
  const precio = formatoPrecio.format(Number(vehiculo.precio));

  const tarjeta = document.createElement("article");
  tarjeta.classList.add("vehiculo-card");
  // Datos guardados en la tarjeta: los usarán los filtros más adelante
  tarjeta.dataset.id = vehiculo.id;
  tarjeta.dataset.nombre = nombre;
  tarjeta.dataset.marca = vehiculo.marca;
  tarjeta.dataset.anio = vehiculo.anio;
  tarjeta.dataset.transmision = vehiculo.transmision;

  const imagen = document.createElement("img");
  imagen.src = vehiculo.imagen;
  imagen.alt = nombre;

  const info = document.createElement("div");
  info.classList.add("vehiculo-info");

  if (compacta) {
    info.append(
      crearElemento("h3", nombre),
      crearElemento("p", vehiculo.anio + " · " + kilometros + " · " + vehiculo.transmision),
      crearElemento("p", precio)
    );
  } else {
    info.append(
      crearElemento("h2", nombre),
      crearElemento("p", "Año: " + vehiculo.anio),
      crearElemento("p", "Kilometraje: " + kilometros),
      crearElemento("p", vehiculo.transmision),
      crearElemento("strong", precio)
    );
  }

  const enlace = crearElemento("a", "Ver detalles");
  enlace.href = "detalles.html?id=" + vehiculo.id;
  enlace.classList.add("btn");
  info.append(enlace);

  tarjeta.append(imagen, info);
  return tarjeta;
}

// Pide los vehículos a la API y los dibuja dentro del contenedor.
// Devuelve la lista de vehículos (vacía si hubo un error) para usarla después.
async function cargarVehiculos(contenedor, url, compacta) {
  mostrarMensaje(contenedor, "Cargando vehículos…");

  try {
    const respuesta = await fetch(url);
    if (!respuesta.ok) {
      throw new Error("Error del servidor: " + respuesta.status);
    }

    const vehiculos = await respuesta.json();

    if (vehiculos.length === 0) {
      mostrarMensaje(contenedor, "Todavía no hay vehículos cargados.");
      return [];
    }

    contenedor.replaceChildren();
    vehiculos.forEach((vehiculo) => {
      contenedor.appendChild(crearTarjeta(vehiculo, compacta));
    });
    return vehiculos;
  } catch (error) {
    console.error(error);
    mostrarMensaje(contenedor, "No se pudieron cargar los vehículos.");
    return [];
  }
}

// ---------- Buscador y filtros (solo en vehiculos.html) ----------

// Pasa a minúsculas y quita las tildes: "Automático" → "automatico".
// Así "corola", "COROLLA" o "volkswágen" encuentran igual.
function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Agrega una <option> por cada valor distinto (sin repetir) a un <select>
function llenarSelect(select, valores) {
  const unicos = [...new Set(valores)];
  unicos.forEach((valor) => {
    const opcion = document.createElement("option");
    opcion.value = valor;
    opcion.textContent = valor;
    select.appendChild(opcion);
  });
}

// Muestra solo las tarjetas que cumplen TODOS los filtros y oculta el resto
function aplicarFiltros() {
  const texto = normalizar(document.getElementById("busqueda").value.trim());
  const marca = document.getElementById("marca").value;
  const anio = document.getElementById("anio").value;
  const transmision = document.getElementById("transmision").value;

  let visibles = 0;

  document.querySelectorAll("#lista-vehiculos .vehiculo-card").forEach((tarjeta) => {
    const coincide =
      normalizar(tarjeta.dataset.nombre).includes(texto) &&
      (marca === "" || tarjeta.dataset.marca === marca) &&
      (anio === "" || tarjeta.dataset.anio === anio) &&
      // normalizar: "manual" cargado en minúscula también coincide con "Manual"
      (transmision === "" || normalizar(tarjeta.dataset.transmision) === normalizar(transmision));

    tarjeta.hidden = !coincide;
    if (coincide) visibles++;
  });

  document.getElementById("sin-resultados").hidden = visibles > 0;
}

// Completa los <select> con los datos reales y activa los eventos
function prepararFiltros(vehiculos) {
  // localeCompare ordena alfabéticamente sin separar mayúsculas de minúsculas
  const marcas = vehiculos.map((v) => v.marca).sort((a, b) => a.localeCompare(b, "es"));
  const anios = vehiculos.map((v) => v.anio).sort((a, b) => b - a); // más nuevo primero

  llenarSelect(document.getElementById("marca"), marcas);
  llenarSelect(document.getElementById("anio"), anios);

  // "input" se dispara con cada letra; "change" al elegir una opción
  document.getElementById("busqueda").addEventListener("input", aplicarFiltros);
  document.getElementById("marca").addEventListener("change", aplicarFiltros);
  document.getElementById("anio").addEventListener("change", aplicarFiltros);
  document.getElementById("transmision").addEventListener("change", aplicarFiltros);
}

// ---------- Detalle de un vehículo (solo en detalles.html) ----------

// Escribe un texto dentro del elemento con ese id ("—" si el dato está vacío)
function completar(id, texto) {
  document.getElementById(id).textContent = texto || "—";
}

// Pide un auto por su id y completa la ficha
async function cargarDetalle(seccion) {
  // Lee el ?id= de la dirección: detalles.html?id=2 → "2"
  const parametros = new URLSearchParams(window.location.search);
  const id = parametros.get("id");

  try {
    const respuesta = await fetch("api/vehiculo.php?id=" + encodeURIComponent(id ?? ""));
    const datos = await respuesta.json();

    if (!respuesta.ok) {
      // 400 (id inválido) o 404 (no existe): mostramos el mensaje que manda PHP
      mostrarMensaje(seccion, datos.error + ".");
      return;
    }

    const nombre = datos.marca + " " + datos.modelo;
    document.title = nombre + " | Full Cars";
    document.getElementById("det-turno").href = "turnos.html?vehiculo=" + datos.id;

    // WhatsApp con el mensaje ya escrito. encodeURIComponent convierte espacios,
    // tildes y signos (¡, ?) al formato que acepta una dirección web.
    const textoWhatsapp =
      "¡Hola! Me interesa el " + nombre + " " + datos.anio +
      " (" + formatoPrecio.format(Number(datos.precio)) + ") que vi en la página de Full Cars: " +
      window.location.href;
    document.getElementById("det-whatsapp").href =
      "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(textoWhatsapp);

    document.querySelectorAll(".galeria img").forEach((imagen) => {
      imagen.src = datos.imagen;
      imagen.alt = nombre;
    });

    completar("det-marca", datos.marca);
    completar("det-modelo", datos.modelo);
    completar("det-precio", formatoPrecio.format(Number(datos.precio)));
    completar("det-anio", datos.anio);
    completar("det-kilometraje", formatoNumero.format(datos.kilometraje) + " km");
    completar("det-motor", datos.motor);
    completar("det-combustible", datos.combustible);
    completar("det-transmision", datos.transmision);
    completar("det-descripcion", datos.descripcion);

    const lista = document.getElementById("det-equipamiento");
    lista.replaceChildren();
    datos.equipamiento.forEach((elemento) => {
      lista.appendChild(crearElemento("li", elemento));
    });
    // Si no tiene equipamiento cargado, ocultamos todo el bloque
    document.getElementById("det-equipamiento-box").hidden = datos.equipamiento.length === 0;
  } catch (error) {
    console.error(error);
    mostrarMensaje(seccion, "No se pudo cargar el vehículo.");
  }
}

// Arranque: según qué contenedor exista, sabemos en qué página estamos
const listaDestacados = document.getElementById("lista-destacados");
const listaVehiculos = document.getElementById("lista-vehiculos");
const detalleVehiculo = document.getElementById("detalle-vehiculo");

if (detalleVehiculo) {
  cargarDetalle(detalleVehiculo);
}

if (listaDestacados) {
  cargarVehiculos(listaDestacados, "api/vehiculos.php?destacados=1", true);
}

if (listaVehiculos) {
  // Primero se cargan los autos; recién después se pueden armar los filtros
  cargarVehiculos(listaVehiculos, "api/vehiculos.php", false).then(prepararFiltros);
}
