/**
 * Informatron - Generador de Informes MAPA
 * Script principal del frontend
 */

// =====================================================
// CONFIGURACIÓN
// =====================================================

const API_BASE_URL = 'https://informesreload-production.up.railway.app';

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
const btnUpdateMeasurements = document.getElementById('btn-update-measurements');
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
  btnStep3.disabled = true;
  
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
    
    goToStep(3);
  }
});

// =====================================================
// PASO 3: MEDICIONES
// =====================================================

// Actualizar mediciones
btnUpdateMeasurements.addEventListener('click', async () => {
  const diurnas = parseInt(medicionesDiurnas.value);
  const nocturnas = parseInt(medicionesNocturnas.value);
  
  if (!diurnas || !nocturnas || diurnas < 1 || nocturnas < 1) {
    alert('Por favor, ingrese valores válidos para ambas mediciones');
    return;
  }
  
  try {
    btnUpdateMeasurements.disabled = true;
    btnUpdateMeasurements.textContent = 'Actualizando...';
    
    const response = await fetch(`${API_BASE_URL}/api/actualizar-mediciones`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paciente: appState.pacienteData,
        medicionesDiurnas: diurnas,
        medicionesNocturnas: nocturnas
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      appState.pacienteData = result.data;
      appState.medicionesActualizadas = true;
      
      // Habilitar siguiente
      btnStep3.disabled = false;
      
      // Mensaje de éxito
      btnUpdateMeasurements.textContent = '✓ Datos Actualizados';
      btnUpdateMeasurements.style.background = 'var(--emerald-500)';
      btnUpdateMeasurements.style.color = 'white';
      
      console.log('✅ Mediciones actualizadas:', appState.pacienteData);
    } else {
      throw new Error(result.message || 'Error al actualizar mediciones');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error al actualizar mediciones: ' + error.message);
    btnUpdateMeasurements.disabled = false;
    btnUpdateMeasurements.textContent = 'Actualizar Datos';
  }
});

// Validar inputs
[medicionesDiurnas, medicionesNocturnas].forEach(input => {
  input.addEventListener('input', () => {
    // Resetear estado de actualización
    if (appState.medicionesActualizadas) {
      appState.medicionesActualizadas = false;
      btnStep3.disabled = true;
      btnUpdateMeasurements.textContent = 'Actualizar Datos';
      btnUpdateMeasurements.style.background = '';
      btnUpdateMeasurements.style.color = '';
    }
  });
});

// Navegación
btnBack3.addEventListener('click', () => {
  goToStep(2);
});

btnStep3.addEventListener('click', () => {
  if (appState.medicionesActualizadas && appState.pacienteData) {
    // Actualizar resumen
    summaryName.textContent = appState.pacienteData.nombre;
    summaryAge.textContent = `${appState.pacienteData.edad} años`;
    summaryInstitution.textContent = appState.institucionNombre;
    summaryDiurnas.textContent = appState.pacienteData.medicionesDiurnas;
    summaryNocturnas.textContent = appState.pacienteData.medicionesNocturnas;
    
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
      a.download = `${appState.pacienteData.nombre.replace(/\s+/g, '_')}_MAPA.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      loadingGenerate.style.display = 'none';
      btnGenerate.textContent = '✓ Informe Descargado';
      btnGenerate.style.background = 'var(--emerald-600)';
      
      console.log('✅ Informe generado y descargado');
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
// INICIALIZACIÓN
// =====================================================

console.log('🚀 Informatron cargado correctamente');
console.log('🔗 API:', API_BASE_URL);
