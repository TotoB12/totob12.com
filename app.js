const config = window.launchpadConfig ?? { showDisabled: false };
const allServices = Array.isArray(window.launchpadServices) ? window.launchpadServices : [];

const state = {
  filter: "all",
  query: "",
};

const serviceList = document.querySelector("#service-list");
const emptyState = document.querySelector("#empty-state");
const searchInput = document.querySelector("#service-search");
const segmentButtons = [...document.querySelectorAll(".segment")];
const template = document.querySelector("#service-card-template");

const activeServices = allServices.filter((service) => config.showDisabled || service.enabled);

function normalise(value) {
  return String(value ?? "").toLowerCase().trim();
}

function matchesService(service) {
  const filterMatches = state.filter === "all" || service.access === state.filter;

  const haystack = [
    service.name,
    service.url,
    service.description,
    service.group,
    ...(service.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();

  return filterMatches && haystack.includes(state.query);
}

function accessLabel(access) {
  return access === "public" ? "Public" : "Tailnet";
}

function initials(name) {
  return name
    .split(/\s+|-/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function createCard(service) {
  const fragment = template.content.cloneNode(true);
  const card = fragment.querySelector(".service-card");
  const link = fragment.querySelector(".service-main");
  const img = fragment.querySelector("img");
  const fallback = fragment.querySelector(".fallback-icon");
  const copyButton = fragment.querySelector(".copy-button");

  card.dataset.access = service.access;
  card.dataset.enabled = String(service.enabled);
  link.href = service.url;
  link.setAttribute("aria-label", `Open ${service.name}`);

  img.src = service.icon;
  img.alt = "";
  fallback.textContent = initials(service.name);
  img.addEventListener("error", () => {
    img.hidden = true;
    fallback.hidden = false;
  });

  fragment.querySelector(".service-name").textContent = service.name;
  fragment.querySelector(".service-description").textContent = service.description;
  fragment.querySelector(".service-url").textContent = service.url.replace(/^https?:\/\//, "");

  const accessPill = fragment.querySelector(".access-pill");
  accessPill.textContent = accessLabel(service.access);
  accessPill.dataset.access = service.access;

  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(service.url);
      copyButton.classList.add("is-copied");
      copyButton.setAttribute("aria-label", "Copied");
      window.setTimeout(() => {
        copyButton.classList.remove("is-copied");
        copyButton.setAttribute("aria-label", "Copy service link");
      }, 1500);
    } catch {
      window.prompt("Copy this link", service.url);
    }
  });

  return fragment;
}

function renderServices() {
  const matches = activeServices.filter(matchesService);
  const fragment = document.createDocumentFragment();

  matches.forEach((service) => fragment.appendChild(createCard(service)));

  serviceList.replaceChildren(fragment);
  emptyState.hidden = matches.length > 0;
}

function setFilter(filter) {
  state.filter = filter;
  segmentButtons.forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  renderServices();
}

searchInput.addEventListener("input", (event) => {
  state.query = normalise(event.target.value);
  renderServices();
});

segmentButtons.forEach((button) => {
  button.addEventListener("click", () => setFilter(button.dataset.filter));
});

renderServices();
