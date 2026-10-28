// js/sesion.js — se carga en TODAS las páginas.
// Pregunta quién está conectado y actualiza el último ítem del menú:
//   visitante → "Ingresar"
//   cliente   → "Hola, Ana" + "Salir"
//   admin     → "Panel" + "Salir"
// No obliga a nadie a iniciar sesión: el sitio sigue siendo público.

// Promesa con el usuario conectado (o null). Otras páginas la reutilizan
// con "await sesionUsuario" para no preguntarle dos veces al servidor.
const sesionUsuario = fetch("api/sesion.php")
  .then((respuesta) => (respuesta.ok ? respuesta.json() : null))
  .catch(() => null);

// Página actual, para volver acá después del login: "financiacion.html"
function paginaActual() {
  const archivo = window.location.pathname.split("/").pop() || "index.html";
  return archivo + window.location.search;
}

async function mostrarSesionEnMenu() {
  const item = document.getElementById("nav-sesion");
  if (!item) return;

  const usuario = await sesionUsuario;

  if (!usuario) {
    const ingresar = item.querySelector("a");
    ingresar.href = "login.html?volver=" + encodeURIComponent(paginaActual());
    return;
  }

  // El admin ve un enlace a su panel; el cliente, solo el saludo
  let enlace;
  if (usuario.rol === "admin") {
    enlace = document.createElement("a");
    enlace.href = "panel.html";
    enlace.textContent = "Panel";
  } else {
    enlace = document.createElement("span");
    enlace.classList.add("nav-saludo");
    // Solo el primer nombre, para que entre en el menú: "Ana María López" → "Ana"
    enlace.textContent = "Hola, " + usuario.nombre.split(" ")[0];
  }

  const salir = document.createElement("button");
  salir.type = "button";
  salir.classList.add("nav-salir");
  salir.textContent = "Salir";
  salir.addEventListener("click", async () => {
    await fetch("api/logout.php", { method: "POST" });
    window.location.reload(); // la página se vuelve a cargar como visitante
  });

  item.replaceChildren(enlace, salir);
}

mostrarSesionEnMenu();
