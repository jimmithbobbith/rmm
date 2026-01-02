const steps = [
  { id: 'car', label: 'Car' },
  { id: 'category', label: 'Select work' },
  { id: 'services', label: 'Services' },
  { id: 'details', label: 'Details' },
  { id: 'confirm', label: 'Confirm' }
];

const state = {
  currentStep: 0,
  data: null,
  car: { reg: '', postcode: '' },
  selectedCategory: null,
  basket: [],
  availability: '',
  timeSlot: '',
  notes: '',
  contact: { name: '', email: '', phone: '' }
};

const els = {};

document.addEventListener('DOMContentLoaded', init);

function init() {
  cacheElements();
  buildProgress();
  attachEvents();
  populateAvailability();
  fetchServices();
  updateNavigation();
  updateSummaries();
}

function cacheElements() {
  els.progress = document.getElementById('progress-steps');
  els.panes = steps.map((step) => document.getElementById(`step-${step.id}`));
  els.back = document.getElementById('back');
  els.next = document.getElementById('next');
  els.reg = document.getElementById('reg');
  els.postcode = document.getElementById('postcode');
  els.carError = document.getElementById('car-error');
  els.carSummary = document.getElementById('car-summary');
  els.categoryGrid = document.getElementById('category-grid');
  els.categoryHeader = document.getElementById('category-header');
  els.categoryError = document.getElementById('category-error');
  els.serviceList = document.getElementById('service-list');
  els.serviceError = document.getElementById('services-error');
  els.basket = document.getElementById('basket');
  els.basketDetails = document.getElementById('basket-details');
  els.basketMobile = document.getElementById('basket-mobile');
  els.detailsSummary = document.getElementById('details-summary');
  els.detailsError = document.getElementById('details-error');
  els.fullName = document.getElementById('full-name');
  els.email = document.getElementById('email');
  els.phone = document.getElementById('phone');
  els.notes = document.getElementById('notes');
  els.availability = document.getElementById('availability');
  els.timeSlot = document.getElementById('time-slot');
  els.confirmSummary = document.getElementById('confirm-summary');
  els.modal = document.getElementById('info-modal');
  els.modalTitle = document.getElementById('modal-title');
  els.modalDescription = document.getElementById('modal-description');
  els.modalList = document.getElementById('modal-list');
  els.modalAdd = document.getElementById('modal-add');
  els.modalClose = document.querySelector('.modal-close');
}

function buildProgress() {
  els.progress.innerHTML = '';
  steps.forEach((step, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'step';
    wrapper.dataset.index = index;
    wrapper.innerHTML = `<span class="icon">${index + 1}</span><span>${step.label}</span>`;
    els.progress.appendChild(wrapper);
  });
  updateProgress();
}

function updateProgress() {
  const nodes = Array.from(els.progress.children);
  nodes.forEach((node, idx) => {
    node.classList.remove('active', 'complete');
    if (idx < state.currentStep) node.classList.add('complete');
    if (idx === state.currentStep) node.classList.add('active');
  });
}

function attachEvents() {
  els.back.addEventListener('click', onBack);
  els.next.addEventListener('click', onNext);
  els.reg.addEventListener('input', () => clearError('car'));
  els.postcode.addEventListener('input', () => clearError('car'));
  els.fullName.addEventListener('input', () => clearError('details'));
  els.email.addEventListener('input', () => clearError('details'));
  els.phone.addEventListener('input', () => clearError('details'));
  els.timeSlot.addEventListener('change', () => clearError('details'));
  els.notes.addEventListener('input', () => (state.notes = els.notes.value));
  els.modalClose.addEventListener('click', closeModal);
  els.modal.addEventListener('click', (e) => {
    if (e.target === els.modal) closeModal();
  });
  els.modalAdd.addEventListener('click', () => {
    const id = els.modalAdd.dataset.service;
    const service = findServiceById(id);
    if (service) {
      addServiceToBasket(service);
      closeModal();
    }
  });
}

function fetchServices() {
  fetch('services.json')
    .then((res) => res.json())
    .then((json) => {
      state.data = json;
      renderCategories();
      renderBasketPanels();
    })
    .catch(() => {
      els.categoryGrid.innerHTML = '<p class="error">Unable to load services right now.</p>';
    });
}

function renderCategories() {
  els.categoryGrid.innerHTML = '';
  state.data.categories.forEach((category) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'category-card';
    card.innerHTML = `<h4>${category.name}</h4><p class="section-subtitle">${category.summary}</p>`;
    card.addEventListener('click', () => selectCategory(category.id));
    card.id = `cat-${category.id}`;
    els.categoryGrid.appendChild(card);
  });
}

function selectCategory(categoryId) {
  state.selectedCategory = categoryId;
  Array.from(document.querySelectorAll('.category-card')).forEach((card) => {
    card.classList.toggle('active', card.id === `cat-${categoryId}`);
  });
  renderCategoryHeader();
  renderServices();
  clearError('services');
  clearError('category');
  updateSummaries();
}

function renderCategoryHeader() {
  if (!state.data || !state.selectedCategory) {
    els.categoryHeader.innerHTML = '';
    return;
  }
  const category = state.data.categories.find((c) => c.id === state.selectedCategory);
  els.categoryHeader.innerHTML = `
    <p class="section-subtitle">${category.lead || ''}</p>
    <h3 class="section-title">${category.name}</h3>
  `;
}

function renderServices() {
  els.serviceList.innerHTML = '';
  if (!state.selectedCategory) {
    els.serviceList.innerHTML = '<p class="section-subtitle">Select a category to see services.</p>';
    return;
  }
  const category = state.data.categories.find((c) => c.id === state.selectedCategory);
  category.services.forEach((service) => {
    const card = document.createElement('div');
    card.className = 'service-card';
    card.innerHTML = `
      <div>
        <h5>${service.name}</h5>
        <p class="service-meta">${service.description}</p>
        <p class="service-meta">⭐ ${service.rating.toFixed(2)} • ${service.reviews} reviews</p>
        ${service.tag ? `<span class="badge">${service.tag}</span>` : ''}
      </div>
      <div class="service-actions">
        <div class="price">£${service.price.toFixed(2)}</div>
        <button class="button secondary" data-info="${service.id}">More info</button>
        <button class="button" data-add="${service.id}">${state.basket.find((b) => b.id === service.id) ? 'Added' : 'Add'}</button>
      </div>
    `;
    card.querySelector('[data-info]').addEventListener('click', () => openModal(service));
    card.querySelector('[data-add]').addEventListener('click', () => toggleService(service));
    els.serviceList.appendChild(card);
  });
}

function openModal(service) {
  els.modalTitle.textContent = service.name;
  els.modalDescription.textContent = service.details;
  els.modalList.innerHTML = '';
  (service.whatToExpect || []).forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    els.modalList.appendChild(li);
  });
  els.modalAdd.dataset.service = service.id;
  els.modal.classList.add('active');
}

function closeModal() {
  els.modal.classList.remove('active');
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
  clearError('services');
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
  renderBasket(els.basket, 'Basket');
  renderBasket(els.basketDetails, 'Basket');
  renderMobileBasket();
}

function renderBasket(container, title = 'Basket') {
  if (!container) return;
  container.innerHTML = '';
  const header = document.createElement('div');
  header.innerHTML = `<h4>${title}</h4>`;
  container.appendChild(header);

  if (!state.basket.length) {
    container.innerHTML += '<p class="section-subtitle">Add services to see your quote.</p>';
    renderMechanics(container);
    return;
  }

  const list = document.createElement('div');
  list.className = 'basket-list';
  state.basket.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'basket-item';
    row.innerHTML = `
      <div>
        <div>${item.name}</div>
        <small class="service-meta">£${item.price.toFixed(2)}</small>
      </div>
      <div>
        <button class="remove" aria-label="Remove ${item.name}">&times;</button>
      </div>
    `;
    row.querySelector('.remove').addEventListener('click', () => {
      state.basket = state.basket.filter((service) => service.id !== item.id);
      renderServices();
      renderBasketPanels();
      updateSummaries();
    });
    list.appendChild(row);
  });

  const total = state.basket.reduce((sum, item) => sum + item.price, 0);
  const totalRow = document.createElement('div');
  totalRow.className = 'basket-total';
  totalRow.innerHTML = `<span>Total</span><span>£${total.toFixed(2)}</span>`;

  container.appendChild(list);
  container.appendChild(totalRow);
  renderMechanics(container);
}

function renderMechanics(container) {
  if (!state.data || !state.data.mechanics) return;
  const wrap = document.createElement('div');
  wrap.className = 'summary-box';
  wrap.innerHTML = '<strong>Your local mechanics</strong>';
  state.data.mechanics.forEach((m) => {
    const row = document.createElement('div');
    row.className = 'service-meta';
    row.textContent = `${m.name} • ${m.rating.toFixed(1)} (${m.jobs} jobs)`;
    wrap.appendChild(row);
  });
  container.appendChild(wrap);
}

function renderMobileBasket() {
  const count = state.basket.length;
  const total = state.basket.reduce((sum, item) => sum + item.price, 0);
  if (!count) {
    els.basketMobile.textContent = 'Basket empty';
    els.basketMobile.onclick = null;
    return;
  }
  els.basketMobile.innerHTML = `<strong>${count} item${count > 1 ? 's' : ''}</strong><span>£${total.toFixed(2)}</span>`;
  els.basketMobile.onclick = () => {
    document.getElementById('step-services').scrollIntoView({ behavior: 'smooth' });
  };
}

function populateAvailability() {
  const today = new Date();
  els.availability.innerHTML = '';
  for (let i = 0; i < 5; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const label = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'pill';
    pill.textContent = label;
    pill.addEventListener('click', () => {
      state.availability = label;
      Array.from(els.availability.children).forEach((el) => el.classList.remove('active'));
      pill.classList.add('active');
      clearError('details');
    });
    els.availability.appendChild(pill);
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
    els.next.textContent = 'Request sent!';
    els.next.disabled = true;
    els.back.disabled = true;
    return;
  }
  state.currentStep += 1;
  showStep();
}

function showStep() {
  els.panes.forEach((pane, idx) => {
    pane.classList.toggle('active', idx === state.currentStep);
  });
  updateNavigation();
  updateProgress();
  updateSummaries();
}

function updateNavigation() {
  els.back.disabled = state.currentStep === 0;
  els.next.textContent = state.currentStep === steps.length - 1 ? 'Send request' : 'Continue';
}

function validateStep() {
  clearError('car');
  clearError('category');
  clearError('services');
  clearError('details');

  switch (steps[state.currentStep].id) {
    case 'car':
      return validateCar();
    case 'category':
      if (!state.selectedCategory) {
        showError('category', 'Select a category to continue.');
        return false;
      }
      return true;
    case 'services':
      if (!state.basket.length) {
        showError('services', 'Add at least one service to your basket.');
        return false;
      }
      return true;
    case 'details':
      return validateDetails();
    default:
      return true;
  }
}

function validateCar() {
  const reg = els.reg.value.trim();
  const postcode = els.postcode.value.trim();
  const postcodeValid = /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/i.test(postcode);
  if (!reg || !postcodeValid) {
    showError('car', 'Enter a valid registration and postcode to continue.');
    return false;
  }
  state.car = { reg: reg.toUpperCase(), postcode: postcode.toUpperCase() };
  updateSummaries();
  return true;
}

function validateDetails() {
  state.contact = {
    name: els.fullName.value.trim(),
    email: els.email.value.trim(),
    phone: els.phone.value.trim()
  };
  state.timeSlot = els.timeSlot.value;
  state.notes = els.notes.value.trim();

  const validEmail = /.+@.+\..+/.test(state.contact.email);
  if (!state.contact.name || !validEmail || state.contact.phone.length < 6) {
    showError('details', 'Please add your name, a valid email and phone number.');
    return false;
  }
  if (!state.availability || !state.timeSlot) {
    showError('details', 'Select when your vehicle is available.');
    return false;
  }
  updateSummaries();
  return true;
}

function showError(scope, message) {
  if (scope === 'car') els.carError.textContent = message;
  if (scope === 'category') els.categoryError.textContent = message;
  if (scope === 'services') els.serviceError.textContent = message;
  if (scope === 'details') els.detailsError.textContent = message;
}

function clearError(scope) {
  if (scope === 'car') els.carError.textContent = '';
  if (scope === 'category') els.categoryError.textContent = '';
  if (scope === 'services') els.serviceError.textContent = '';
  if (scope === 'details') els.detailsError.textContent = '';
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
  if (state.car.reg || state.car.postcode) {
    els.carSummary.textContent = `${state.car.reg || 'Reg pending'} • ${state.car.postcode || 'Postcode pending'}`;
  }

  if (state.selectedCategory) {
    const cat = state.data.categories.find((c) => c.id === state.selectedCategory);
    els.detailsSummary.innerHTML = `<strong>${cat.name}</strong><div class="service-meta">${cat.summary}</div>`;
  } else {
    els.detailsSummary.textContent = 'Category not selected yet.';
  }

  if (state.basket.length) {
    const list = state.basket.map((s) => `${s.name} (£${s.price.toFixed(2)})`).join('<br>');
    els.detailsSummary.innerHTML += `<div class="service-meta">${list}</div>`;
  }

  const total = state.basket.reduce((sum, item) => sum + item.price, 0);
  els.confirmSummary.innerHTML = `
    <div><strong>Vehicle:</strong> ${state.car.reg || '—'} (${state.car.postcode || '—'})</div>
    <div><strong>Services:</strong><br>${state.basket.map((s) => s.name).join('<br>') || 'None selected'}</div>
    <div><strong>Availability:</strong> ${state.availability || 'Not provided'} • ${state.timeSlot || ''}</div>
    <div><strong>Contact:</strong> ${state.contact.name || '—'} • ${state.contact.email || '—'} • ${state.contact.phone || '—'}</div>
    <div class="basket-total" style="margin-top:8px;"><span>Total</span><span>£${total.toFixed(2)}</span></div>
  `;
}
