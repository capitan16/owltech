/**
 * OWLTECH AUTOMATION - MAIN JAVASCRIPT
 * Interactivity, tabs, team card flip, filters and form handling
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initNavigation();
  initCorporateTabs();
  // Ocultado temporalmente: microinteracción y carga de descripciones de integrantes
  // initTeamCards();
  // initTeamDescriptions();
  initProjectFilters();
  initContactForm();
  initProjectDetailNav();
  initOwlEyeTracking();
});

/* ==========================================================================
   1. Header Scroll & Mobile Nav
   ========================================================================== */
function initHeader() {
  const header = document.getElementById('siteHeader');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 30) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

function initNavigation() {
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  const navLinks = document.querySelectorAll('.nav-link');

  // Toggle Menú Móvil
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', !isExpanded);
      mainNav.classList.toggle('is-open');
    });

    // Cerrar menú móvil al hacer click en un enlace
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Active link on scroll (IntersectionObserver)
  const sections = document.querySelectorAll('section[id]');
  if ('IntersectionObserver' in window && sections.length > 0) {
    const observerOptions = {
      root: null,
      rootMargin: '-30% 0px -60% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const currentId = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            if (link.getAttribute('href') === `#${currentId}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));
  }
}

/* ==========================================================================
   2. Sección Corporativa (Pestañas / Tabs)
   ========================================================================== */
function initCorporateTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  if (!tabButtons.length || !tabPanels.length) return;

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetPanelId = button.getAttribute('data-tab');

      // Actualizar estado de botones
      tabButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      });
      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');

      // Mostrar panel correspondiente
      tabPanels.forEach(panel => {
        if (panel.id === targetPanelId) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });
    });

    // Accesibilidad teclado (flechas izquierda / derecha)
    button.addEventListener('keydown', (e) => {
      const tabsArray = Array.from(tabButtons);
      const currentIndex = tabsArray.indexOf(button);

      let nextIndex = null;
      if (e.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % tabsArray.length;
      } else if (e.key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + tabsArray.length) % tabsArray.length;
      }

      if (nextIndex !== null) {
        e.preventDefault();
        tabsArray[nextIndex].focus();
        tabsArray[nextIndex].click();
      }
    });
  });
}

/* ==========================================================================
   3. Sección de Equipo: Microinteracción Card Flip (Click / Touch / Teclado)
   ========================================================================== */
function initTeamCards() {
  const teamCards = document.querySelectorAll('.team-card');

  teamCards.forEach(card => {
    // Alternar flip en click o tap (especialmente útil en dispositivos táctiles)
    card.addEventListener('click', (e) => {
      // Si se hizo click en el botón de agendar consulta, permitir propagación normal
      if (e.target.closest('.btn-contact-member')) {
        return;
      }
      card.classList.toggle('is-flipped');
    });

    // Soporte para accesibilidad vía teclado (Enter o Espacio)
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.classList.toggle('is-flipped');
      }
    });

    // Restaurar si el cursor sale
    card.addEventListener('mouseleave', () => {
      card.classList.remove('is-flipped');
    });
  });
}

/* ==========================================================================
   3.1 Carga Dinámica de Descripciones desde "Descripcion integrantes/*.txt"
   ========================================================================== */
function initTeamDescriptions() {
  const teamCards = document.querySelectorAll('.team-card[data-member]');
  if (!teamCards.length) return;

  teamCards.forEach(card => {
    const memberId = card.getAttribute('data-member');
    if (!memberId) return;

    // Ruta al archivo de texto de cada integrante
    const txtPath = `Descripcion integrantes/integrante${memberId}.txt`;

    fetch(encodeURI(txtPath))
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then(text => {
        if (!text || !text.trim()) return;
        parseAndUpdateCard(card, text);
      })
      .catch(() => {
        // En caso de ejecutarse vía file:// o sin servidor,
        // se mantienen transparentemente los textos predefinidos en el HTML
      });
  });
}

function parseAndUpdateCard(card, text) {
  // Parser flexible para capturar las 3 secciones oficiales:
  // FORMACION:
  // CERTIFICACIONES:
  // ESPECIALIDAD:
  const getSectionContent = (label) => {
    const regex = new RegExp(
      `${label}:\\s*([\\s\\S]*?)(?=(?:FORMACION|CERTIFICACIONES|ESPECIALIDAD):|$)`,
      'i'
    );
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  };

  const formacion = getSectionContent('FORMACION');
  const certificaciones = getSectionContent('CERTIFICACIONES');
  const especialidad = getSectionContent('ESPECIALIDAD');

  if (formacion) {
    const el = card.querySelector('.info-formacion');
    if (el) el.textContent = formacion;
  }

  if (certificaciones) {
    const el = card.querySelector('.info-certificaciones');
    if (el) el.textContent = certificaciones;
  }

  if (especialidad) {
    const el = card.querySelector('.info-especialidad');
    if (el) el.textContent = especialidad;
  }
}

/* ==========================================================================
   4. Sección de Proyectos: Filtros de Categoría
   ========================================================================== */
function initProjectFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  if (!filterButtons.length || !projectCards.length) return;

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filterValue === 'all' || category === filterValue) {
          card.style.display = 'flex';
          card.style.animation = 'fadeIn 0.35s ease forwards';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* ==========================================================================
   5. Formulario de Contacto Corporativo
   ========================================================================== */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const successAlert = document.getElementById('formSuccessAlert');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let isValid = true;

    // Validación Campo Nombre
    const nameInput = document.getElementById('inputName');
    const nameError = document.getElementById('nameError');
    if (!nameInput.value.trim()) {
      showError(nameInput, nameError);
      isValid = false;
    } else {
      clearError(nameInput, nameError);
    }

    // Validación Campo Correo
    const emailInput = document.getElementById('inputEmail');
    const emailError = document.getElementById('emailError');
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput.value.trim() || !emailPattern.test(emailInput.value.trim())) {
      showError(emailInput, emailError);
      isValid = false;
    } else {
      clearError(emailInput, emailError);
    }

    // Validación Campo Teléfono
    const phoneInput = document.getElementById('inputPhone');
    const phoneError = document.getElementById('phoneError');
    if (!phoneInput.value.trim() || phoneInput.value.trim().length < 6) {
      showError(phoneInput, phoneError);
      isValid = false;
    } else {
      clearError(phoneInput, phoneError);
    }

    // Validación Campo Mensaje
    const messageInput = document.getElementById('inputMessage');
    const messageError = document.getElementById('messageError');
    if (!messageInput.value.trim() || messageInput.value.trim().length < 10) {
      showError(messageInput, messageError);
      isValid = false;
    } else {
      clearError(messageInput, messageError);
    }

    // Validación Política de Privacidad
    const checkPrivacy = document.getElementById('checkPrivacy');
    const privacyError = document.getElementById('privacyError');
    if (!checkPrivacy.checked) {
      if (privacyError) privacyError.classList.add('visible');
      isValid = false;
    } else {
      if (privacyError) privacyError.classList.remove('visible');
    }

    if (isValid) {
      const submitBtn = document.getElementById('btnSubmitForm');
      const originalText = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Enviando información...</span>';

      setTimeout(() => {
        form.reset();
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;

        if (successAlert) {
          successAlert.style.display = 'flex';
          successAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

          setTimeout(() => {
            successAlert.style.display = 'none';
          }, 8000);
        }
      }, 900);
    }
  });

  function showError(input, errorElement) {
    input.classList.add('is-invalid');
    if (errorElement) errorElement.classList.add('visible');
  }

  function clearError(input, errorElement) {
    input.classList.remove('is-invalid');
    if (errorElement) errorElement.classList.remove('visible');
  }

  // Limpiar errores al escribir
  form.querySelectorAll('.form-control').forEach(input => {
    input.addEventListener('input', () => {
      input.classList.remove('is-invalid');
      const errorMsg = input.closest('.form-group')?.querySelector('.form-error');
      if (errorMsg) errorMsg.classList.remove('visible');
    });
  });
}

/* ==========================================================================
   6. Navegación Interna de Secciones (proyecto-lactea-40.html)
   ========================================================================== */
function initProjectDetailNav() {
  const detailNavLinks = document.querySelectorAll('.sec-nav-link');
  if (!detailNavLinks.length) return;

  const detailSections = document.querySelectorAll('.detail-section');
  if (!detailSections.length) return;

  if ('IntersectionObserver' in window) {
    const detailObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const currentId = entry.target.getAttribute('id');
          detailNavLinks.forEach(link => {
            if (link.getAttribute('href') === `#${currentId}`) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    });

    detailSections.forEach(section => detailObserver.observe(section));
  }
}

/* ==========================================================================
   7. Animación Sutil de Ojos del Búho (OWLTECH AUTOMATION)
   Modifica exclusivamente #left-pupil y #right-pupil en el SVG
   ========================================================================== */
function initOwlEyeTracking() {
  const owlSvgs = document.querySelectorAll('.owl-logo-svg');
  if (!owlSvgs.length) return;

  // Límite máximo de desplazamiento en unidades de viewBox (viewBox 350x215)
  // Radio de iris = 36, radio de pupila = 18. Margen seguro = 18.
  // 13.5 unidades garantiza una mirada claramente perceptible sin salir del iris ámbar.
  const MAX_OFFSET = 13.5;
  const LERP_FACTOR = 0.16; // Interpolación suave y orgánica

  const eyeInstances = [];

  owlSvgs.forEach(svg => {
    const leftPupil = svg.querySelector('#left-pupil');
    const rightPupil = svg.querySelector('#right-pupil');

    if (leftPupil && rightPupil) {
      eyeInstances.push({
        svg: svg,
        leftPupil: leftPupil,
        rightPupil: rightPupil,
        currentLeftX: 0,
        currentLeftY: 0,
        currentRightX: 0,
        currentRightY: 0,
        targetLeftX: 0,
        targetLeftY: 0,
        targetRightX: 0,
        targetRightY: 0
      });
    }
  });

  if (!eyeInstances.length) return;

  function updateEyes(clientX, clientY) {
    eyeInstances.forEach(instance => {
      const rect = instance.svg.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const scaleX = rect.width / 350;
      const scaleY = rect.height / 215;

      // Centros absolutos de cada ojo en la pantalla
      const leftEyeCenterX = rect.left + 100 * scaleX;
      const leftEyeCenterY = rect.top + 111 * scaleY;
      const rightEyeCenterX = rect.left + 250 * scaleX;
      const rightEyeCenterY = rect.top + 111 * scaleY;

      // Vector y distancia Ojo Izquierdo
      const dxL = clientX - leftEyeCenterX;
      const dyL = clientY - leftEyeCenterY;
      const distL = Math.hypot(dxL, dyL);

      if (distL > 1) {
        const angleL = Math.atan2(dyL, dxL);
        // Deflexión progresiva que alcanza mirada completa
        const strengthL = Math.min(MAX_OFFSET, Math.max(3, distL / 6));
        instance.targetLeftX = Math.cos(angleL) * strengthL;
        instance.targetLeftY = Math.sin(angleL) * strengthL;
      }

      // Vector y distancia Ojo Derecho
      const dxR = clientX - rightEyeCenterX;
      const dyR = clientY - rightEyeCenterY;
      const distR = Math.hypot(dxR, dyR);

      if (distR > 1) {
        const angleR = Math.atan2(dyR, dxR);
        const strengthR = Math.min(MAX_OFFSET, Math.max(3, distR / 6));
        instance.targetRightX = Math.cos(angleR) * strengthR;
        instance.targetRightY = Math.sin(angleR) * strengthR;
      }
    });
  }

  function resetEyes() {
    eyeInstances.forEach(instance => {
      instance.targetLeftX = 0;
      instance.targetLeftY = 0;
      instance.targetRightX = 0;
      instance.targetRightY = 0;
    });
  }

  // Eventos de puntero y mouse (soporta tanto ratón como trackpad en Windows)
  window.addEventListener('pointermove', (e) => {
    // En pantallas puramente táctiles, mantener estático (Regla 9)
    if (e.pointerType === 'touch') return;
    updateEyes(e.clientX, e.clientY);
  }, { passive: true });

  window.addEventListener('mousemove', (e) => {
    updateEyes(e.clientX, e.clientY);
  }, { passive: true });

  // Cuando el cursor sale de la ventana (Regla 8)
  document.addEventListener('mouseleave', resetEyes);
  window.addEventListener('blur', resetEyes);

  // Bucle continuo con requestAnimationFrame para animación suave (Regla 7)
  function renderPupils() {
    eyeInstances.forEach(instance => {
      instance.currentLeftX += (instance.targetLeftX - instance.currentLeftX) * LERP_FACTOR;
      instance.currentLeftY += (instance.targetLeftY - instance.currentLeftY) * LERP_FACTOR;
      instance.currentRightX += (instance.targetRightX - instance.currentRightX) * LERP_FACTOR;
      instance.currentRightY += (instance.targetRightY - instance.currentRightY) * LERP_FACTOR;

      // Transformar exclusivamente los elementos #left-pupil y #right-pupil
      instance.leftPupil.setAttribute(
        'transform',
        `translate(${instance.currentLeftX.toFixed(2)} ${instance.currentLeftY.toFixed(2)})`
      );
      instance.rightPupil.setAttribute(
        'transform',
        `translate(${instance.currentRightX.toFixed(2)} ${instance.currentRightY.toFixed(2)})`
      );
    });

    requestAnimationFrame(renderPupils);
  }

  requestAnimationFrame(renderPupils);
}


