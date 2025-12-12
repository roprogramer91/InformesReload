// Test de la función contarMedicionesDiaNoche
const { contarMedicionesDiaNoche } = require('./functions/contadorMediciones.js');

// Caso de prueba con datos simulados
const testText = `
42 2025/12/4 06:45 125 98 86 39 65 0
43 2025/12/4 07:00 124 99 87 37 66 0
44 2025/12/4 08:00 126 100 88 38 67 0
45 2025/12/4 12:00 128 102 90 40 68 0
46 2025/12/4 18:00 130 104 92 42 70 0
47 2025/12/4 21:59 132 106 94 44 72 0
48 2025/12/4 22:00 106 82 68 38 57 0
49 2025/12/5 00:00 104 80 66 36 55 0
50 2025/12/5 02:00 102 78 64 34 53 0
51 2025/12/5 06:59 100 76 62 32 51 0
`;

console.log('=== Test de Contador de Mediciones ===\n');

const resultado = contarMedicionesDiaNoche(testText);

console.log('\n=== Validación de Resultados ===');
console.log(`Diurnas esperadas: 5, obtenidas: ${resultado.medicionesDiurnas}`);
console.log(`Nocturnas esperadas: 5, obtenidas: ${resultado.medicionesNocturnas}`);
console.log(`Total esperado: 10, obtenido: ${resultado.totalMediciones}`);

// Validaciones
const testsPasados = 
  resultado.medicionesDiurnas === 5 &&
  resultado.medicionesNocturnas === 5 &&
  resultado.totalMediciones === 10;

if (testsPasados) {
  console.log('\n✅ ¡TODOS LOS TESTS PASARON EXITOSAMENTE!');
} else {
  console.log('\n❌ Algunos tests fallaron');
  process.exit(1);
}
