/**
 * Informatron - Generador de Informes MAPA
 * Script principal del frontend
 */

// =====================================================
// CONFIGURACIÓN
// =====================================================

const _isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const _isDev = new URLSearchParams(window.location.search).has('dev');

const API_BASE_URL = !_isLocal
  ? 'https://informesreload-production.up.railway.app'
  : _isDev
    ? 'https://informesreload-dev-entorno.up.railway.app'
    : 'http://localhost:3000';

// Estado global de la aplicación
const appState = {
  currentStep: 1,
  institucionId: null,
  institucionNombre: null,
  pdfFile: null,
  pacienteData: null,
  medicionesActualizadas: false
};

// =====================================================
// ELEMENTOS DEL DOM
// =====================================================

// Pasos del wizard
const steps = document.querySelectorAll('.wizard-step');
const progressSteps = document.querySelectorAll('.progress-step');

// Paso 1: Institución
const institutionCards = document.querySelectorAll('.institution-card');
const btnStep1 = document.getElementById('btn-step-1');

// Paso 2: PDF
const uploadArea = document.getElementById('upload-area');
const pdfInput = document.getElementById('pdf-input');
const fileInfo = document.getElementById('file-info');
const fileName = document.getElementById('file-name');
const fileSize = document.getElementById('file-size');
const btnRemoveFile = document.getElementById('btn-remove-file');
const loadingPdf = document.getElementById('loading-pdf');
const btnBack2 = document.getElementById('btn-back-2');
const btnStep2 = document.getElementById('btn-step-2');

// Paso 3: Mediciones
const patientName = document.getElementById('patient-name');
const patientAge = document.getElementById('patient-age');
const medicionesDiurnas = document.getElementById('mediciones-diurnas');
const medicionesNocturnas = document.getElementById('mediciones-nocturnas');
const btnBack3 = document.getElementById('btn-back-3');
const btnStep3 = document.getElementById('btn-step-3');

// Paso 4: Generación
const summaryName = document.getElementById('summary-name');
const summaryAge = document.getElementById('summary-age');
const summaryInstitution = document.getElementById('summary-institution');
const summaryDiurnas = document.getElementById('summary-diurnas');
const summaryNocturnas = document.getElementById('summary-nocturnas');
const loadingGenerate = document.getElementById('loading-generate');
const btnRestart = document.getElementById('btn-restart');
const btnGenerate = document.getElementById('btn-generate');

// =====================================================
// FUNCIONES DE NAVEGACIÓN
// =====================================================

function goToStep(stepNumber) {
  // Actualizar paso actual
  appState.currentStep = stepNumber;
  
  // Actualizar pasos del wizard
  steps.forEach((step, index) => {
    step.classList.toggle('active', index + 1 === stepNumber);
  });
  
  // Actualizar indicadores de progreso
  progressSteps.forEach((step, index) => {
    const stepNum = index + 1;
    step.classList.toggle('active', stepNum === stepNumber);
    step.classList.toggle('completed', stepNum < stepNumber);
  });
  
  // Scroll al top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetWizard() {
  appState.currentStep = 1;
  appState.institucionId = null;
  appState.institucionNombre = null;
  appState.pdfFile = null;
  appState.pacienteData = null;
  appState.medicionesActualizadas = false;
  
  // Resetear selección de institución
  institutionCards.forEach(card => card.classList.remove('selected'));
  btnStep1.disabled = true;
  
  // Resetear PDF
  pdfInput.value = '';
  uploadArea.style.display = 'block';
  fileInfo.style.display = 'none';
  btnStep2.disabled = true;
  
  // Resetear mediciones
  medicionesDiurnas.value = '';
  medicionesNocturnas.value = '';
  
  // Resetear botón de generar informe
  btnGenerate.disabled = false;
  btnGenerate.textContent = 'Generar y Descargar Informe';
  btnGenerate.style.background = '';
  loadingGenerate.style.display = 'none';
  
  goToStep(1);
}

// =====================================================
// PASO 1: SELECCIÓN DE INSTITUCIÓN
// =====================================================

institutionCards.forEach(card => {
  card.addEventListener('click', () => {
    // Remover selección previa
    institutionCards.forEach(c => c.classList.remove('selected'));
    
    // Seleccionar tarjeta
    card.classList.add('selected');
    
    // Guardar datos
    appState.institucionId = card.dataset.id;
    appState.institucionNombre = card.querySelector('h3').textContent;
    
    // Habilitar botón siguiente
    btnStep1.disabled = false;
  });
});

btnStep1.addEventListener('click', () => {
  goToStep(2);
});

// =====================================================
// PASO 2: CARGA DE PDF
// =====================================================

// Click en área de carga
uploadArea.addEventListener('click', () => {
  pdfInput.click();
});

// Drag & Drop
uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  
  const files = e.dataTransfer.files;
  if (files.length > 0 && files[0].type === 'application/pdf') {
    handleFileSelect(files[0]);
  } else {
    alert('Por favor, seleccione un archivo PDF válido');
  }
});

// Selección de archivo
pdfInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFileSelect(e.target.files[0]);
  }
});

// Procesar archivo
async function handleFileSelect(file) {
  appState.pdfFile = file;
  
  // Mostrar información del archivo
  fileName.textContent = file.name;
  fileSize.textContent = `${(file.size / 1024).toFixed(2)} KB`;
  uploadArea.style.display = 'none';
  fileInfo.style.display = 'flex';
  
  // Mostrar spinner
  loadingPdf.style.display = 'block';
  btnStep2.disabled = true;
  
  try {
    // Enviar PDF al backend
    const formData = new FormData();
    formData.append('pdfFile', file);
    
    const response = await fetch(`${API_BASE_URL}/api/upload-pdf`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    if (result.success) {
      appState.pacienteData = result.data;
      console.log('✅ Paciente cargado:', appState.pacienteData);
      
      // Habilitar botón siguiente
      btnStep2.disabled = false;
      
      // Ocultar spinner
      loadingPdf.style.display = 'none';
    } else {
      throw new Error(result.message || 'Error al cargar el PDF');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error al procesar el PDF: ' + error.message);
    loadingPdf.style.display = 'none';
    removeFile();
  }
}

// Remover archivo
function removeFile() {
  appState.pdfFile = null;
  appState.pacienteData = null;
  pdfInput.value = '';
  uploadArea.style.display = 'block';
  fileInfo.style.display = 'none';
  btnStep2.disabled = true;
}

btnRemoveFile.addEventListener('click', (e) => {
  e.stopPropagation();
  removeFile();
});

// Navegación
btnBack2.addEventListener('click', () => {
  goToStep(1);
});

btnStep2.addEventListener('click', () => {
  if (appState.pacienteData) {
    // Actualizar información del paciente en paso 3
    patientName.textContent = appState.pacienteData.nombre;
    patientAge.textContent = appState.pacienteData.edad;
    
    // Pre-llenar campos con valores automáticos calculados del PDF
    const diurnas = appState.pacienteData.medicionesDiurnas || 0;
    const nocturnas = appState.pacienteData.medicionesNocturnas || 0;
    
    // Llenar los inputs editables con valores automáticos
    medicionesDiurnas.value = diurnas;
    medicionesNocturnas.value = nocturnas;
    
    console.log('✅ Mediciones automáticas pre-cargadas:', { diurnas, nocturnas });
    console.log('   (Los campos son editables si necesitas ajustar los valores)');
    
    goToStep(3);
  }
});

// =====================================================
// PASO 3: MEDICIONES
// =====================================================

// Las mediciones ya están calculadas automáticamente, el paso 3 solo muestra los valores
// El botón de siguiente está siempre habilitado porque los valores ya vienen del PDF


// Navegación
btnBack3.addEventListener('click', () => {
  goToStep(2);
});

btnStep3.addEventListener('click', () => {
  if (appState.pacienteData) {
    // Leer valores actuales (pueden ser automáticos o editados manualmente)
    const diurnas = parseInt(medicionesDiurnas.value) || 0;
    const nocturnas = parseInt(medicionesNocturnas.value) || 0;
    
    // Actualizar en el estado
    appState.pacienteData.medicionesDiurnas = diurnas;
    appState.pacienteData.medicionesNocturnas = nocturnas;
    
    // Actualizar resumen
    summaryName.textContent = appState.pacienteData.nombre;
    summaryAge.textContent = `${appState.pacienteData.edad} años`;
    summaryInstitution.textContent = appState.institucionNombre;
    summaryDiurnas.textContent = diurnas;
    summaryNocturnas.textContent = nocturnas;
    
    goToStep(4);
  }
});

// =====================================================
// PASO 4: GENERACIÓN DE INFORME
// =====================================================

btnGenerate.addEventListener('click', async () => {
  try {
    btnGenerate.disabled = true;
    loadingGenerate.style.display = 'block';
    
    const response = await fetch(`${API_BASE_URL}/api/generar-informe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paciente: appState.pacienteData,
        institucionId: appState.institucionId
      })
    });
    
    if (response.ok) {
      // Descargar archivo
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const contentDisp = response.headers.get('Content-Disposition') || '';
      const matchRfc = contentDisp.match(/filename\*=UTF-8''(.+)/i);
      const matchPlain = contentDisp.match(/filename="(.+?)"/);
      a.download = matchRfc ? decodeURIComponent(matchRfc[1]) : matchPlain ? matchPlain[1] : `${appState.pacienteData.nombre}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      loadingGenerate.style.display = 'none';
      btnGenerate.textContent = '✓ Informe Descargado';
      btnGenerate.style.background = 'var(--emerald-600)';

      console.log('✅ Informe generado y descargado');
    } else if (response.status === 422) {
      const data = await response.json();
      if (data.insuficiente) {
        loadingGenerate.style.display = 'none';

        const horas = data.duracionHoras != null ? `${data.duracionHoras} hs (mínimo requerido: ${data.horasMinimas} hs)` : '';
        const mensaje = `Paciente: ${data.nombre}\nFecha del estudio: ${data.fecha}${horas ? '\nDuración del estudio: ' + horas : ''}\n\u{1F6A8} RECLAMAR: el MAPA no cuenta con las horas/mediciones suficientes para realizar el informe.`;
        const urlWhatsApp = `https://wa.me/5491131080805?text=${encodeURIComponent(mensaje)}`;
        window.open(urlWhatsApp, '_blank');

        btnGenerate.textContent = '✓ WhatsApp Abierto';
        btnGenerate.style.background = '#25D366';
        console.log('📲 Estudio insuficiente - WhatsApp abierto');
      }
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Error al generar el informe');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error al generar el informe: ' + error.message);
    loadingGenerate.style.display = 'none';
    btnGenerate.disabled = false;
  }
});

btnRestart.addEventListener('click', () => {
  if (confirm('¿Está seguro que desea volver al inicio? Se perderán los datos actuales.')) {
    resetWizard();
  }
});

// =====================================================
// MODE TABS
// =====================================================

const btnModePdf = document.getElementById('btn-mode-pdf');
const btnModeAwp = document.getElementById('btn-mode-awp');
const pdfProgress = document.getElementById('pdf-progress');
const pdfMain = document.querySelector('.main-content');
const awpSection = document.getElementById('awp-section');

btnModePdf.addEventListener('click', () => {
  btnModePdf.classList.add('active');
  btnModeAwp.classList.remove('active');
  pdfProgress.classList.remove('hidden');
  pdfMain.classList.remove('hidden');
  awpSection.classList.add('hidden');
});

btnModeAwp.addEventListener('click', () => {
  btnModeAwp.classList.add('active');
  btnModePdf.classList.remove('active');
  pdfProgress.classList.add('hidden');
  pdfMain.classList.add('hidden');
  awpSection.classList.remove('hidden');
});

// =====================================================
// MODO AWP — LOTE
// =====================================================

const awpState = {
  institucionId: null,
  institucionNombre: null
};

const awpInstitutionCards = document.querySelectorAll('#awp-institutions .institution-card');
const awpUploadZone = document.getElementById('awp-upload-zone');
const awpDropArea = document.getElementById('awp-drop-area');
const awpInput = document.getElementById('awp-input');
const awpFileList = document.getElementById('awp-file-list');

awpInstitutionCards.forEach(card => {
  card.addEventListener('click', () => {
    awpInstitutionCards.forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    awpState.institucionId = card.dataset.id;
    awpState.institucionNombre = card.querySelector('h3').textContent;
    awpUploadZone.classList.remove('hidden');
  });
});

awpDropArea.addEventListener('click', () => awpInput.click());

awpDropArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  awpDropArea.classList.add('drag-over');
});

awpDropArea.addEventListener('dragleave', () => {
  awpDropArea.classList.remove('drag-over');
});

awpDropArea.addEventListener('drop', (e) => {
  e.preventDefault();
  awpDropArea.classList.remove('drag-over');
  const files = Array.from(e.dataTransfer.files).filter(f => f.name.toLowerCase().endsWith('.awp'));
  if (files.length === 0) { alert('Solo se aceptan archivos .awp'); return; }
  procesarTanda(files);
});

awpInput.addEventListener('change', (e) => {
  const files = Array.from(e.target.files);
  if (files.length > 0) procesarTanda(files);
  awpInput.value = '';
});

function procesarTanda(files) {
  // Limpiar lista anterior — cada tanda es independiente
  awpFileList.innerHTML = '';

  // Crear filas de progreso para todos los archivos
  const items = files.map(file => {
    const itemId = `awp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const item = document.createElement('div');
    item.className = 'awp-file-item';
    item.id = itemId;
    item.innerHTML = `
      <div class="awp-file-info">
        <span class="awp-file-status">⏳</span>
        <div class="awp-file-details">
          <div class="awp-patient-name">Procesando...</div>
          <div class="awp-file-meta">${file.name}</div>
        </div>
      </div>
    `;
    awpFileList.appendChild(item);
    return { file, itemId };
  });

  // Procesar cada archivo (las descargas se disparan automáticamente al completar)
  items.forEach(({ file, itemId }) => procesarAwp(file, itemId));
}

async function procesarAwp(file, itemId) {
  const item = document.getElementById(itemId);
  const statusEl = item.querySelector('.awp-file-status');
  const nameEl = item.querySelector('.awp-patient-name');
  const metaEl = item.querySelector('.awp-file-meta');

  try {
    const formData = new FormData();
    formData.append('awpFile', file);
    formData.append('institucionId', awpState.institucionId);

    const response = await fetch(`${API_BASE_URL}/api/procesar-awp`, {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      const matchRfc2 = disposition.match(/filename\*=UTF-8''(.+)/i);
      const matchPlain2 = disposition.match(/filename="(.+?)"/);
      const nombreArchivo = matchRfc2 ? decodeURIComponent(matchRfc2[1]) : matchPlain2 ? matchPlain2[1] : file.name.replace('.awp', '.pdf');
      const pacienteNombre = nombreArchivo.replace(/\.(pdf|docx)$/, '');

      // Auto-descarga inmediata
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = nombreArchivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      statusEl.textContent = '✅';
      nameEl.textContent = pacienteNombre;
      metaEl.textContent = `${awpState.institucionNombre} · descargado`;
      item.classList.add('ok');
      registrarEnHistorial(pacienteNombre, awpState.institucionNombre, 'ok');

    } else if (response.status === 422) {
      const data = await response.json();

      statusEl.textContent = '⚠️';
      nameEl.textContent = data.nombre || file.name;
      metaEl.textContent = `Fecha: ${data.fecha || '-'} · estudio insuficiente`;
      item.classList.add('warn');
      registrarEnHistorial(data.nombre || file.name, awpState.institucionNombre, 'warn');

      const mensaje = `Paciente: ${data.nombre}\nFecha del estudio: ${data.fecha}\n⚠️ Reclamar: el MAPA no cuenta con las horas/mediciones suficientes para realizar el informe.`;
      const urlWhatsApp = `https://wa.me/5491131080805?text=${encodeURIComponent(mensaje)}`;

      const btn = document.createElement('button');
      btn.className = 'btn-awp-whatsapp';
      btn.textContent = 'WhatsApp';
      btn.addEventListener('click', () => window.open(urlWhatsApp, '_blank'));
      item.appendChild(btn);

    } else {
      throw new Error(`Error ${response.status}`);
    }
  } catch (error) {
    statusEl.textContent = '❌';
    nameEl.textContent = file.name;
    metaEl.textContent = error.message;
    item.classList.add('err');
    registrarEnHistorial(file.name, awpState.institucionNombre || '-', 'err');
  }
}

// =====================================================
// HISTORIAL (localStorage)
// =====================================================

const HISTORIAL_KEY = 'informatron_historial';
const historialVacio = document.getElementById('historial-vacio');
const historialTabla = document.getElementById('historial-tabla');
const historialTbody = document.getElementById('historial-tbody');
const btnLimpiarHistorial = document.getElementById('btn-limpiar-historial');

function cargarHistorial() {
  try { return JSON.parse(localStorage.getItem(HISTORIAL_KEY)) || []; }
  catch { return []; }
}

function guardarHistorial(historial) {
  localStorage.setItem(HISTORIAL_KEY, JSON.stringify(historial));
}

function agregarAlHistorial(entry) {
  const historial = cargarHistorial();
  historial.unshift(entry); // más reciente primero
  guardarHistorial(historial);
  renderHistorial();
}

function renderHistorial() {
  const historial = cargarHistorial();
  if (historial.length === 0) {
    historialVacio.style.display = 'block';
    historialTabla.style.display = 'none';
    return;
  }
  historialVacio.style.display = 'none';
  historialTabla.style.display = 'table';

  historialTbody.innerHTML = historial.map(e => {
    const estadoLabel = e.estado === 'ok' ? '✅ Descargado' : e.estado === 'warn' ? '⚠️ Insuficiente' : '❌ Error';
    return `<tr>
      <td>${e.fecha}</td>
      <td>${e.hora}</td>
      <td><strong>${e.nombre}</strong></td>
      <td>${e.institucion}</td>
      <td><span class="historial-estado ${e.estado}">${estadoLabel}</span></td>
    </tr>`;
  }).join('');
}

btnLimpiarHistorial.addEventListener('click', () => {
  if (confirm('¿Limpiar todo el historial?')) {
    localStorage.removeItem(HISTORIAL_KEY);
    renderHistorial();
  }
});

function registrarEnHistorial(nombre, institucion, estado) {
  const ahora = new Date();
  agregarAlHistorial({
    fecha: ahora.toLocaleDateString('es-AR'),
    hora:  ahora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
    nombre,
    institucion,
    estado
  });
}

// Cargar historial al iniciar
renderHistorial();

// =====================================================
// INICIALIZACIÓN
// =====================================================

console.log('🚀 Informatron cargado correctamente');
console.log('🔗 API:', API_BASE_URL);
