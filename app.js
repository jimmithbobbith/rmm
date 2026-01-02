const steps = [
  { id: "car", label: "Car" },
  { id: "category", label: "Select work" },
  { id: "details", label: "Details" },
  { id: "confirm", label: "Book" },
];

const state = {
  currentStep: 0,
  data: null,
  car: { reg: "", postcode: "", areaLabel: "", vehicle: null },
  selectedCategory: null,
  basket: [],
  availability: [],
  driveable: null,
  notes: "",
  clarifier: {
    active: false,
    complete: false,
    stopped: false,
    currentIndex: 0,
    answers: [],
  },
  contact: {
    name: "",
    email: "",
    phone: "",
    addressLine: "",
    addressPostcode: "",
  },
};

const clarifierQuestions = [
  "When did the issue first appear?",
  "Does it happen at specific speeds or temperatures?",
  "Are there any warning lights or smells accompanying it?",
];

const els = {};

document.addEventListener("DOMContentLoaded", init);

function init() {
  cacheElements();
  buildProgress();
  attachEvents();
  renderDriveableOptions();
  renderWeekAvailability();
  renderClarifier();
  fetchServices();
  updateNavigation();
  updateSummaries();
}

function cacheElements() {
  els.progress = document.getElementById("progress-steps");
  els.panes = steps.map((step) => document.getElementById(`step-${step.id}`));
  els.back = document.getElementById("back");
  els.next = document.getElementById("next");
  els.reg = document.getElementById("reg");
  els.postcode = document.getElementById("postcode");
  els.carError = document.getElementById("car-error");
  els.carSummary = document.getElementById("car-summary");
  els.locationLabel = document.getElementById("location-label");
  els.vehicleLabel = document.getElementById("vehicle-label");
  els.categoryGrid = document.getElementById("category-grid");
  els.categoryHeader = document.getElementById("category-header");
  els.categoryError = document.getElementById("category-error");
  els.serviceList = document.getElementById("service-list");
  els.serviceError = document.getElementById("services-error");
  els.basket = document.getElementById("basket");
  els.basketDetails = document.getElementById("basket-details");
  els.basketMobile = document.getElementById("basket-mobile");
  els.detailsSummary = document.getElementById("details-summary");
  els.detailsError = document.getElementById("details-error");
  els.fullName = document.getElementById("full-name");
  els.email = document.getElementById("email");
  els.phone = document.getElementById("phone");
  els.addressLine = document.getElementById("address-line");
  els.addressPostcode = document.getElementById("address-postcode");
  els.notes = document.getElementById("notes");
  els.driveable = document.getElementById("driveable");
  els.weekAvailability = document.getElementById("week-availability");
  els.clarifierStart = document.getElementById("clarifier-start");
  els.clarifierPanel = document.getElementById("clarifier-panel");
  els.confirmSummary = document.getElementById("confirm-summary");
  els.modal = document.getElementById("info-modal");
  els.modalTitle = document.getElementById("modal-title");
  els.modalDescription = document.getElementById("modal-description");
  els.modalList = document.getElementById("modal-list");
  els.modalAdd = document.getElementById("modal-add");
  els.modalClose = document.querySelector(".modal-close");
}

function buildProgress() {
  els.progress.innerHTML = "";
  steps.forEach((step, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "step";
    wrapper.dataset.index = index;
    wrapper.innerHTML = `<span class="icon">${index + 1}</span><span>${step.label}</span>`;
    els.progress.appendChild(wrapper);
  });
  updateProgress();
}

function updateProgress() {
  const nodes = Array.from(els.progress.children);
  nodes.forEach((node, idx) => {
    node.classList.remove("active", "complete");
    if (idx < state.currentStep) node.classList.add("complete");
    if (idx === state.currentStep) node.classList.add("active");
  });
}

function attachEvents() {
  els.back.addEventListener("click", onBack);
  els.next.addEventListener("click", onNext);
  els.reg.addEventListener("input", () => {
    clearError("car");
    debounceVehicleLookup();
  });
  els.postcode.addEventListener("input", () => {
    clearError("car");
    debouncePostcodeLookup();
  });
  els.fullName.addEventListener("input", () => clearError("details"));
  els.email.addEventListener("input", () => clearError("details"));
  els.phone.addEventListener("input", () => clearError("details"));
  els.addressLine.addEventListener("input", () => clearError("details"));
  els.addressPostcode.addEventListener("input", () => clearError("details"));
  els.notes.addEventListener("input", () => (state.notes = els.notes.value));
  els.clarifierStart.addEventListener("click", startClarifier);
  els.modalClose.addEventListener("click", closeModal);
  els.modal.addEventListener("click", (e) => {
    if (e.target === els.modal) closeModal();
  });
  els.modalAdd.addEventListener("click", () => {
    const id = els.modalAdd.dataset.service;
    const service = findServiceById(id);
    if (service) {
      addServiceToBasket(service);
      closeModal();
    }
  });
}

function fetchServices() {
  fetch("services.json")
    .then((res) => res.json())
    .then((json) => {
      state.data = json;
      renderCategories();
      renderBasketPanels();
    })
    .catch(() => {
      els.categoryGrid.innerHTML =
        '<p class="error">Unable to load services right now.</p>';
    });
}

const mockVehicles = [
  { pattern: /^AB/, make: "Ford", model: "Fiesta", year: 2018 },
  { pattern: /^CD/, make: "Volkswagen", model: "Golf", year: 2020 },
  { pattern: /^EF/, make: "Vauxhall", model: "Corsa", year: 2017 },
];

const categoryIcons = {
  repairs: "fa-screwdriver-wrench",
  diagnostics: "fa-magnifying-glass-chart",
  servicing: "fa-clipboard-list",
  prepurchase: "fa-car-side",
};

function debounce(fn, delay = 400) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

const debouncePostcodeLookup = debounce(handlePostcodeLookup);
const debounceVehicleLookup = debounce(handleVehicleLookup);

function handlePostcodeLookup() {
  const postcode = els.postcode.value.trim();
  const postcodeValid = /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/i.test(
    postcode,
  );
  if (!postcodeValid) {
    state.car.areaLabel = "";
    els.locationLabel.textContent = "";
    els.locationLabel.classList.add("hidden");
    updateSummaries();
    renderBasketPanels();
    return;
  }
  state.car.postcode = postcode.toUpperCase();
  els.locationLabel.classList.remove("hidden");
  els.locationLabel.textContent = "Looking up area…";
  fetchAreaLabel(postcode)
    .then((label) => {
      state.car.areaLabel = label;
      els.locationLabel.textContent = label
        ? `📍 ${state.car.postcode} • ${label}`
        : "";
      els.locationLabel.classList.toggle("hidden", !els.locationLabel.textContent);
      prefillAddressPostcode();
      updateSummaries();
      renderBasketPanels();
    })
    .catch((err) => {
      state.car.areaLabel = "";
      els.locationLabel.textContent = "";
      els.locationLabel.classList.add("hidden");
      showError("car", err.message);
      updateSummaries();
      renderBasketPanels();
    });
}

function fetchAreaLabel(postcode) {
  const encoded = encodeURIComponent(postcode.trim());
  return fetch(`https://api.postcodes.io/postcodes/${encoded}`)
    .then((res) => {
      if (!res.ok) throw new Error("Postcode lookup failed.");
      return res.json();
    })
    .then((json) => {
      if (json.status !== 200 || !json.result)
        throw new Error("Postcode not found.");
      const result = json.result;
      const place = [result.admin_district, result.region]
        .filter(Boolean)
        .join(", ");
      return place || result.country || "";
    });
}

function handleVehicleLookup() {
  const reg = els.reg.value.trim();
  if (reg.length < 5) {
    state.car.vehicle = null;
    els.vehicleLabel.textContent = "";
    updateSummaries();
    renderBasketPanels();
    return;
  }
  state.car.reg = reg.toUpperCase();
  els.vehicleLabel.textContent = "Searching vehicle…";
  lookupVehicle(reg)
    .then((vehicle) => {
      state.car.vehicle = vehicle;
      els.vehicleLabel.textContent = `🚗 ${vehicle.make} ${vehicle.model} (${vehicle.year})`;
      clearError("car");
      updateSummaries();
      renderBasketPanels();
    })
    .catch((err) => {
      state.car.vehicle = null;
      els.vehicleLabel.textContent = "";
      showError("car", err.message);
      updateSummaries();
      renderBasketPanels();
    });
}

function prefillAddressPostcode() {
  if (!els.addressPostcode || !state.car.postcode) return;
  const current = els.addressPostcode.value.trim();
  if (!current) {
    els.addressPostcode.value = state.car.postcode;
    state.contact.addressPostcode = state.car.postcode;
  }
}

function lookupVehicle(reg) {
  return new Promise((resolve, reject) => {
    const clean = reg.replace(/\s+/g, "").toUpperCase();
    if (clean.length < 5) {
      reject(new Error("Registration looks too short."));
      return;
    }
    const matched = mockVehicles.find((item) => item.pattern.test(clean));
    const fallbackYear = 2014 + (clean.charCodeAt(0) % 8);
    const payload = matched || {
      make: "Example Motors",
      model: "Hatchback",
      year: fallbackYear,
    };
    setTimeout(() => resolve({ ...payload, reg: clean }), 250);
  });
}

function renderCategories() {
  els.categoryGrid.innerHTML = "";
  state.data.categories.forEach((category) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "category-card";
    const icon = categoryIcons[category.id] || "fa-car";
    card.innerHTML = `
      <div class="category-icon"><i class="fa-solid ${icon}" aria-hidden="true"></i></div>
      <div>
        <h3>${category.name}</h3>
        <p class="category-summary">${category.summary}</p>
      </div>
    `;
    card.addEventListener("click", () => selectCategory(category.id));
    card.id = `cat-${category.id}`;
    els.categoryGrid.appendChild(card);
  });
}

function selectCategory(categoryId) {
  state.selectedCategory = categoryId;
  Array.from(document.querySelectorAll(".category-card")).forEach((card) => {
    card.classList.toggle("active", card.id === `cat-${categoryId}`);
  });
  renderCategoryHeader();
  renderServices();
  clearError("services");
  clearError("category");
  updateSummaries();
}

function renderCategoryHeader() {
  if (!state.data || !state.selectedCategory) {
    els.categoryHeader.innerHTML = "";
    return;
  }
  const category = state.data.categories.find(
    (c) => c.id === state.selectedCategory,
  );
  els.categoryHeader.innerHTML = `
    <p class="section-subtitle">${category.lead || ""}</p>
    <h3 class="section-title">${category.name}</h3>
  `;
}

function renderServices() {
  els.serviceList.innerHTML = "";
  if (!state.selectedCategory) {
    els.serviceList.innerHTML =
      '<p class="section-subtitle">Select a category to see services.</p>';
    return;
  }
  const category = state.data.categories.find(
    (c) => c.id === state.selectedCategory,
  );
  const categoryIcon = categoryIcons[category.id] || "fa-car";
  category.services.forEach((service) => {
    const card = document.createElement("div");
    card.className = "service-card";
    card.innerHTML = `
      <div class="service-top">
        <div class="service-title">
          <div class="service-icon"><i class="fa-solid ${categoryIcon}" aria-hidden="true"></i></div>
          <div>
            <h3>${service.name}</h3>
            <p class="service-rating">⭐ ${service.rating.toFixed(2)} • ${service.reviews} reviews</p>
          </div>
        </div>
        ${service.tag ? `<span class="badge">${service.tag}</span>` : ""}
      </div>
      <div class="service-body">
        <p class="service-description">${service.description}</p>
      </div>
      <div class="service-footer">
        <div class="price-stack">
          <div class="price">£${service.price.toFixed(2)}</div>
          <div class="service-meta">Includes parts and labour</div>
        </div>
        <div class="service-buttons">
          <button class="button secondary" data-info="${service.id}">More info</button>
          <button class="button" data-add="${service.id}">${state.basket.find((b) => b.id === service.id) ? "Added" : "Add"}</button>
        </div>
      </div>
    `;
    card
      .querySelector("[data-info]")
      .addEventListener("click", () => openModal(service));
    card
      .querySelector("[data-add]")
      .addEventListener("click", () => toggleService(service));
    els.serviceList.appendChild(card);
  });
}

function openModal(service) {
  els.modalTitle.textContent = service.name;
  els.modalDescription.textContent = service.details;
  els.modalList.innerHTML = "";
  (service.whatToExpect || []).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    els.modalList.appendChild(li);
  });
  els.modalAdd.dataset.service = service.id;
  els.modal.classList.add("active");
}

function closeModal() {
  els.modal.classList.remove("active");
}

function toggleService(service) {
  const exists = state.basket.find((item) => item.id === service.id);
  if (exists) {
    state.basket = state.basket.filter((item) => item.id !== service.id);
  } else {
    addServiceToBasket(service);
  }
  renderServices();
  renderBasketPanels();
  updateSummaries();
  clearError("services");
}

function addServiceToBasket(service) {
  if (!state.basket.find((item) => item.id === service.id)) {
    state.basket.push({ ...service });
  }
  renderServices();
  renderBasketPanels();
  updateSummaries();
}

function renderBasketPanels() {
  renderBasket(els.basket, "Basket");
  renderBasket(els.basketDetails, "Basket");
  renderMobileBasket();
}

function renderBasket(container, title = "Basket") {
  if (!container) return;
  container.innerHTML = "";
  const header = document.createElement("div");
  header.innerHTML = `<h4>${title}</h4>`;
  container.appendChild(header);

  const carLines = buildCarSummaryLines();
  if (carLines.length) {
    const carBox = document.createElement("div");
    carBox.className = "summary-box";
    carBox.innerHTML = `<strong>Your vehicle</strong><div class="service-meta">${carLines.join("<br>")}</div>`;
    container.appendChild(carBox);
  }

  if (!state.basket.length) {
    const empty = document.createElement("p");
    empty.className = "section-subtitle";
    empty.textContent = "Add services to see your quote.";
    container.appendChild(empty);
    return;
  }

  const list = document.createElement("div");
  list.className = "basket-list";
  state.basket.forEach((item) => {
    const row = document.createElement("div");
    row.className = "basket-item";
    row.innerHTML = `
      <div>
        <div>${item.name}</div>
        <small class="service-meta">£${item.price.toFixed(2)}</small>
      </div>
      <div>
        <button class="remove" aria-label="Remove ${item.name}">&times;</button>
      </div>
    `;
    row.querySelector(".remove").addEventListener("click", () => {
      state.basket = state.basket.filter((service) => service.id !== item.id);
      renderServices();
      renderBasketPanels();
      updateSummaries();
    });
    list.appendChild(row);
  });

  const total = state.basket.reduce((sum, item) => sum + item.price, 0);
  const totalRow = document.createElement("div");
  totalRow.className = "basket-total";
  totalRow.innerHTML = `<span>Total</span><span>£${total.toFixed(2)}</span>`;

  container.appendChild(list);
  container.appendChild(totalRow);
}

function renderMobileBasket() {
  const count = state.basket.length;
  const total = state.basket.reduce((sum, item) => sum + item.price, 0);
  if (!count) {
    els.basketMobile.textContent = "Basket empty";
    els.basketMobile.onclick = null;
    return;
  }
  els.basketMobile.innerHTML = `<strong>${count} item${count > 1 ? "s" : ""}</strong><span>£${total.toFixed(2)}</span>`;
  els.basketMobile.onclick = () => {
    document
      .getElementById("step-services")
      .scrollIntoView({ behavior: "smooth" });
  };
}

function renderDriveableOptions() {
  if (!els.driveable) return;
  els.driveable.innerHTML = "";
  ["Yes", "No"].forEach((label) => {
    const value = label === "Yes";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pill";
    btn.textContent = label;
    btn.addEventListener("click", () => {
      state.driveable = value;
      Array.from(els.driveable.children).forEach((el) =>
        el.classList.remove("active"),
      );
      btn.classList.add("active");
      clearError("details");
      updateSummaries();
    });
    els.driveable.appendChild(btn);
  });
}

function renderWeekAvailability() {
  if (!els.weekAvailability) return;
  const today = new Date();
  els.weekAvailability.innerHTML = "";
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayLabel = date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    const column = document.createElement("div");
    column.className = "day-column";
    column.innerHTML = `<div class="day-label">${dayLabel}</div>`;
    ["8am - 12pm", "12pm - 4pm", "4pm - 8pm"].forEach((slot) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "slot-pill";
      const label = `${slot}`;
      button.textContent = label;
      const isActive = state.availability.some(
        (selection) =>
          selection.day === date.toDateString() && selection.slot === label,
      );
      if (isActive) button.classList.add("active");
      button.addEventListener("click", () => {
        if (isActive) {
          state.availability = state.availability.filter(
            (selection) =>
              !(selection.day === date.toDateString() && selection.slot === label),
          );
        } else {
          state.availability = [
            ...state.availability,
            { day: date.toDateString(), slot: label },
          ];
        }
        renderWeekAvailability();
        clearError("details");
        updateSummaries();
      });
      column.appendChild(button);
    });
    els.weekAvailability.appendChild(column);
  }
}

function onBack() {
  if (state.currentStep === 0) return;
  state.currentStep -= 1;
  showStep();
}

function onNext() {
  if (!validateStep()) return;
  if (state.currentStep === steps.length - 1) {
    els.next.textContent = "Request sent!";
    els.next.disabled = true;
    els.back.disabled = true;
    return;
  }
  state.currentStep += 1;
  showStep();
}

function startClarifier() {
  state.clarifier = {
    active: true,
    complete: false,
    stopped: false,
    currentIndex: 0,
    answers: [],
  };
  renderClarifier();
}

function handleClarifierAnswer() {
  const input = document.getElementById("clarifier-input");
  if (!input) return;
  const value = input.value.trim();
  if (!value) return;
  state.clarifier.answers[state.clarifier.currentIndex] = value;
  state.clarifier.currentIndex += 1;
  if (state.clarifier.currentIndex >= clarifierQuestions.length) {
    state.clarifier.complete = true;
  }
  renderClarifier();
  updateSummaries();
}

function stopClarifier() {
  state.clarifier.stopped = true;
  state.clarifier.complete = true;
  renderClarifier();
  updateSummaries();
}

function renderClarifier() {
  if (!els.clarifierPanel) return;
  if (els.clarifierStart) {
    els.clarifierStart.textContent = state.clarifier.active
      ? "Restart clarifier"
      : "Start clarifier";
  }
  els.clarifierPanel.innerHTML = "";
  const { active, complete, currentIndex, answers, stopped } = state.clarifier;

  if (!active) {
    const hint = document.createElement("p");
    hint.className = "service-meta";
    hint.textContent =
      "We will tailor questions to describe symptoms for the mechanic.";
    els.clarifierPanel.appendChild(hint);
    return;
  }

  if (complete) {
    const summary = document.createElement("div");
    summary.className = "summary-box";
    const items = answers
      .map((ans, idx) =>
        ans
          ? `<li><strong>Q${idx + 1}:</strong> ${clarifierQuestions[idx]}<br>${ans}</li>`
          : "",
      )
      .filter(Boolean)
      .join("");
    summary.innerHTML = `
      <strong>Clarifier summary</strong>
      <p class="service-meta">Neutral description to share with the mechanic.</p>
      <ul class="clarifier-summary">${items || "<li>No extra details were provided.</li>"}</ul>
      ${stopped ? '<div class="service-meta">Customer stopped: "I\'ve told you all I know".</div>' : ""}
    `;
    els.clarifierPanel.appendChild(summary);
    return;
  }

  const question = document.createElement("div");
  question.className = "clarifier-question";
  question.innerHTML = `
    <div class="clarifier-progress">Question ${currentIndex + 1} of ${clarifierQuestions.length}</div>
    <div class="clarifier-text">${clarifierQuestions[currentIndex]}</div>
    <textarea id="clarifier-input" placeholder="Add a brief note"></textarea>
    <div class="clarifier-actions">
      <button class="button" type="button" id="clarifier-next">${currentIndex === clarifierQuestions.length - 1 ? "Finish" : "Next question"}</button>
      <button class="button secondary" type="button" id="clarifier-stop">I've told you all I know</button>
    </div>
  `;
  els.clarifierPanel.appendChild(question);
  const input = document.getElementById("clarifier-input");
  input.value = answers[currentIndex] || "";
  document
    .getElementById("clarifier-next")
    .addEventListener("click", handleClarifierAnswer);
  document
    .getElementById("clarifier-stop")
    .addEventListener("click", stopClarifier);
}

function showStep() {
  els.panes.forEach((pane, idx) => {
    pane.classList.toggle("active", idx === state.currentStep);
  });
  if (steps[state.currentStep].id === "details") {
    prefillAddressPostcode();
    renderDriveableOptions();
    renderWeekAvailability();
    renderClarifier();
  }
  updateNavigation();
  updateProgress();
  updateSummaries();
}

function updateNavigation() {
  els.back.disabled = state.currentStep === 0;
  els.next.textContent =
    state.currentStep === steps.length - 1 ? "Send request" : "Continue";
}

function validateStep() {
  clearError("car");
  clearError("category");
  clearError("services");
  clearError("details");

  switch (steps[state.currentStep].id) {
    case "car":
      return validateCar();
    case "category":
      if (!state.selectedCategory) {
        showError("category", "Select a category to continue.");
        scrollToElement(els.categoryGrid);
        return false;
      }
      if (!state.basket.length) {
        showError("services", "Add at least one service to your basket.");
        scrollToElement(els.serviceList);
        return false;
      }
      return true;
    case "details":
      return validateDetails();
    default:
      return true;
  }
}

function validateCar() {
  const reg = els.reg.value.trim();
  const postcode = els.postcode.value.trim();
  const postcodeValid = /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/i.test(
    postcode,
  );
  if (!reg || !postcodeValid) {
    showError("car", "Enter a valid registration and postcode to continue.");
    scrollToElement(els.carError || els.reg);
    return false;
  }
  state.car = {
    ...state.car,
    reg: reg.toUpperCase(),
    postcode: postcode.toUpperCase(),
  };
  prefillAddressPostcode();
  updateSummaries();
  renderBasketPanels();
  return true;
}

function validateDetails() {
  state.contact = {
    name: els.fullName.value.trim(),
    email: els.email.value.trim(),
    phone: els.phone.value.trim(),
    addressLine: els.addressLine.value.trim(),
    addressPostcode: els.addressPostcode.value.trim().toUpperCase(),
  };
  state.notes = els.notes.value.trim();

  const validEmail =
    !state.contact.email || /.+@.+\..+/.test(state.contact.email);
  const postcodeValid = /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/i.test(
    state.contact.addressPostcode,
  );
  if (
    !state.contact.name ||
    !validEmail ||
    state.contact.phone.length < 6 ||
    !state.contact.addressLine ||
    !postcodeValid
  ) {
    showError(
      "details",
      "Please add your name, phone and address with a valid postcode. Email is optional.",
    );
    scrollToElement(els.fullName);
    return false;
  }
  if (!state.availability.length) {
    showError("details", "Select an availability slot for the week.");
    scrollToElement(els.weekAvailability);
    return false;
  }
  if (state.driveable === null) {
    showError("details", "Tell us if the vehicle is driveable.");
    scrollToElement(els.driveable);
    return false;
  }
  updateSummaries();
  return true;
}

function showError(scope, message) {
  if (scope === "car") els.carError.textContent = message;
  if (scope === "category") els.categoryError.textContent = message;
  if (scope === "services") els.serviceError.textContent = message;
  if (scope === "details") els.detailsError.textContent = message;
}

function clearError(scope) {
  if (scope === "car") els.carError.textContent = "";
  if (scope === "category") els.categoryError.textContent = "";
  if (scope === "services") els.serviceError.textContent = "";
  if (scope === "details") els.detailsError.textContent = "";
}

function findServiceById(id) {
  if (!state.data) return null;
  for (const cat of state.data.categories) {
    const service = cat.services.find((s) => s.id === id);
    if (service) return service;
  }
  return null;
}

function updateSummaries() {
  const carLines = buildCarSummaryLines();
  if (carLines.length) {
    els.carSummary.innerHTML = `<strong>Vehicle</strong><div class="service-meta">${carLines.join("<br>")}</div>`;
  } else {
    els.carSummary.textContent =
      "Add your registration and postcode to start your quote.";
  }

  if (state.selectedCategory) {
    const cat = state.data.categories.find(
      (c) => c.id === state.selectedCategory,
    );
    els.detailsSummary.innerHTML = `<strong>${cat.name}</strong><div class="service-meta">${cat.summary}</div>`;
  } else {
    els.detailsSummary.textContent = "Category not selected yet.";
  }

  if (state.basket.length) {
    const list = state.basket
      .map((s) => `${s.name} (£${s.price.toFixed(2)})`)
      .join("<br>");
    els.detailsSummary.innerHTML += `<div class="service-meta">${list}</div>`;
  }

  const availabilityText = state.availability.length
    ? state.availability
        .map(
          (slot) => `${slot.slot} on ${formatAvailabilityDay(slot.day)}`,
        )
        .join("<br>")
    : "Availability not set";
  const driveableText =
    state.driveable === null
      ? "Driveable status not provided"
      : state.driveable
        ? "Vehicle can be driven"
        : "Vehicle not driveable";
  const addressText = state.contact.addressLine
    ? `${state.contact.addressLine} (${state.contact.addressPostcode || "postcode needed"})`
    : "Address pending";
  const clarifierText = state.clarifier.complete
    ? "Clarifier summary ready to share."
    : "Clarifier not completed yet.";
  els.detailsSummary.innerHTML += `<div class="service-meta">${availabilityText}<br>${driveableText}<br>${addressText}<br>${clarifierText}</div>`;

  const total = state.basket.reduce((sum, item) => sum + item.price, 0);
  const carInfo = carLines.join(" • ") || "Vehicle pending";
  const availabilityLabel = state.availability.length
    ? state.availability
        .map(
          (slot) => `${formatAvailabilityDay(slot.day)} • ${slot.slot}`,
        )
        .join("<br>")
    : "Not provided";
  const contactAddress = state.contact.addressLine
    ? `${state.contact.addressLine} • ${state.contact.addressPostcode || ""}`
    : "—";
  const driveableLabel =
    state.driveable === null ? "Not stated" : state.driveable ? "Yes" : "No";
  const clarifierSummary = state.clarifier.complete
    ? state.clarifier.answers
        .map((ans, idx) => (ans ? `Q${idx + 1}: ${ans}` : ""))
        .filter(Boolean)
        .join("<br>") || "No extra details were provided."
    : "Not run yet.";
  const notesText = state.notes || "Not provided";
  els.confirmSummary.innerHTML = `
    <div><strong>Vehicle:</strong> ${carInfo}</div>
    <div><strong>Services:</strong><br>${state.basket.map((s) => s.name).join("<br>") || "None selected"}</div>
    <div><strong>Availability:</strong> ${availabilityLabel}</div>
    <div><strong>Driveable:</strong> ${driveableLabel}</div>
    <div><strong>Contact:</strong> ${state.contact.name || "—"} • ${state.contact.phone || "—"}</div>
    <div><strong>Email:</strong> ${state.contact.email || "Not provided"}</div>
    <div><strong>Address:</strong> ${contactAddress}</div>
    <div><strong>Problem description:</strong><br>${notesText}</div>
    <div><strong>Clarifier:</strong><br>${clarifierSummary}</div>
    <div class="basket-total" style="margin-top:8px;"><span>Total</span><span>£${total.toFixed(2)}</span></div>
  `;
}

function formatAvailabilityDay(dayString) {
  const date = new Date(dayString);
  if (Number.isNaN(date)) return dayString;
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function scrollToElement(el) {
  if (!el || typeof el.scrollIntoView !== "function") return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
}

function buildCarSummaryLines() {
  const lines = [];
  if (state.car.reg) lines.push(state.car.reg);
  if (state.car.vehicle) {
    const { make, model, year } = state.car.vehicle;
    lines.push(`${make} ${model} (${year})`);
  }
  const location = [state.car.postcode, state.car.areaLabel]
    .filter(Boolean)
    .join(" • ");
  if (location) lines.push(location);
  return lines;
}
