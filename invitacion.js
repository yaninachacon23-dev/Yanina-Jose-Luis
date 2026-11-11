// Colocá el MP3 autorizado en assets/ y configurá su ruta aquí.
const musicFile = "musica.mp3";
const ceremonyDate = new Date("2027-02-07T17:00:00-03:00");
const pages = ["sobre", "invitacion", "itinerario"];
const envelope = document.querySelector(".envelope");
const audio = document.querySelector("#cancion");
const musicButtons = document.querySelectorAll("[data-music]");
const floatingMusic = document.querySelector(".music-toggle");
const musicStatus = document.querySelector("#estado-musica");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let invitationScroll = 0;
let openingTimer;
let statusTimer;
let activePage;
let audioStarting = false;

history.scrollRestoration = "manual";

function showPage() {
  const hash = location.hash.slice(1);
  const nextPage = pages.includes(hash) ? hash : "sobre";
  if (nextPage === activePage) return;

  clearTimeout(openingTimer);
  envelope.classList.remove("is-opening");
  if (activePage === "invitacion") invitationScroll = window.scrollY;
  if (nextPage === "sobre") invitationScroll = 0;

  const previousPage = activePage;
  activePage = nextPage;
  document.body.dataset.page = nextPage;
  for (const page of pages) document.getElementById(page).hidden = page !== nextPage;

  floatingMusic.hidden = nextPage === "sobre";
  if (nextPage === "sobre") {
    audio.pause();
    musicStatus.textContent = "";
  }
  const invitation = document.querySelector("#invitacion");
  invitation.classList.toggle("is-arriving", previousPage === "sobre" && nextPage === "invitacion");
  const returning = previousPage === "itinerario" && nextPage === "invitacion";
  window.scrollTo(0, returning ? invitationScroll : 0);

  if (!previousPage) return;
  const focusTarget = {
    sobre: "#abrir",
    invitacion: returning && invitationScroll > 0 ? "#ver-itinerario" : "#titulo",
    itinerario: "#titulo-itinerario",
  };
  document.querySelector(focusTarget[nextPage]).focus({ preventScroll: true });
}

window.addEventListener("hashchange", showPage);
showPage();

document.querySelector("#abrir").addEventListener("click", (event) => {
  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || reducedMotion.matches) return;
  event.preventDefault();
  if (envelope.classList.contains("is-opening")) return;
  envelope.classList.add("is-opening");
  openingTimer = setTimeout(() => { location.hash = "#invitacion"; }, 580);
});

function showMusicStatus(message) {
  clearTimeout(statusTimer);
  musicStatus.textContent = message;
  statusTimer = setTimeout(() => { musicStatus.textContent = ""; }, 4500);
}

function syncMusic() {
  const playing = !audio.paused;
  for (const button of musicButtons) {
    button.setAttribute("aria-pressed", String(playing));
    button.setAttribute("aria-label", playing ? "Pausar música" : "Reproducir música");
  }
  floatingMusic.firstElementChild.textContent = playing ? "Ⅱ" : "♫";
}

if (musicFile) audio.src = musicFile;
for (const event of ["play", "pause", "ended"]) audio.addEventListener(event, syncMusic);
for (const button of musicButtons) {
  button.addEventListener("click", async () => {
    if (!musicFile) {
      showMusicStatus("La canción todavía no está disponible.");
      return;
    }
    if (!audio.paused) {
      audio.pause();
      return;
    }
    if (audioStarting) return;
    audioStarting = true;
    try {
      await audio.play();
      if (activePage === "sobre") audio.pause();
    } catch (error) {
      if (error.name !== "AbortError") showMusicStatus("No se pudo reproducir la canción.");
    } finally {
      audioStarting = false;
      syncMusic();
    }
  });
}

const whatsappRecipients = {
  novia: "5492615050688",
  novio: "5492617078623",
};
const attendanceMessages = {
  si: "Acepto con mucho gusto.",
  no: "Lamentablemente no puedo asistir.",
  pareja: "Asistiré en pareja.",
};

document.querySelector("#rsvp").addEventListener("submit", (event) => {
  event.preventDefault();
  const number = whatsappRecipients[event.submitter?.value];
  if (!number) return;

  const details = new FormData(event.currentTarget);
  const name = details.get("nombre").trim();
  const attendance = details.get("asistencia");
  const companion = details.get("acompanante").trim();
  const wishes = details.get("mensaje").trim();
  const lines = [
    "¡Hola! Les escribo por la invitación a su boda.",
    `Nombre: ${name}`,
    `Asistencia: ${attendanceMessages[attendance]}`,
  ];
  if (attendance === "pareja" && companion) lines.push(`Acompañante: ${companion}`);
  if (wishes) lines.push(`Buenos deseos: ${wishes}`);

  const message = encodeURIComponent(lines.join("\n"));
  window.open(`https://wa.me/${number}?text=${message}`, "_blank", "noopener,noreferrer");
});

const countdown = Object.fromEntries(
  [...document.querySelectorAll("[data-count]")].map((node) => [node.dataset.count, node])
);
const accessibleTime = document.querySelector("#tiempo-restante");

function updateCountdown() {
  const seconds = Math.max(0, Math.ceil((ceremonyDate - Date.now()) / 1000));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor(seconds / 3600) % 24;
  const minutes = Math.floor(seconds / 60) % 60;
  for (const [unit, value] of Object.entries({ days, hours, minutes, seconds: seconds % 60 })) {
    countdown[unit].textContent = String(value).padStart(2, "0");
  }
  accessibleTime.textContent = seconds
    ? `Faltan ${days} días, ${hours} horas y ${minutes} minutos.`
    : "Llegó el día de la boda.";
}
updateCountdown();
setInterval(updateCountdown, 1000);

