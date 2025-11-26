# Tabla de Clasificación de Presión Arterial - MAPA

## Guía de Referencia para Validación Médica

Este documento detalla todos los casos posibles de clasificación de presión arterial utilizados en el sistema Informatron.

---

## 📊 Clasificación de Presión Arterial

### Lógica Implementada

La clasificación se basa en los valores promedio de 24 horas:

- **Sistólica (SYS)**: Presión máxima
- **Diastólica (DIA)**: Presión mínima

---

## 🔍 Categorías y Ejemplos

### 1. **Normal**

- **Criterio**: SYS < 120 **Y** DIA < 80
- **Ejemplos**:
  - 110/70 mmHg → Normal ✓
  - 119/79 mmHg → Normal ✓
  - 115/75 mmHg → Normal ✓

---

### 2. **Presión Arterial Elevada**

- **Criterio**: SYS 120-129 **Y** DIA < 80
- **Ejemplos**:
  - 125/75 mmHg → Elevada ✓
  - 129/79 mmHg → Elevada ✓
  - 122/70 mmHg → Elevada ✓
- **Nota**: Si la diastólica es ≥80, ya no es "Elevada" sino Nivel 1

---

### 3. **Hipertensión Nivel 1**

- **Criterio**: SYS 130-159 **O** DIA 80-99
- **Ejemplos**:
  - 135/75 mmHg → Nivel 1 ✓ (sistólica en rango)
  - 125/85 mmHg → Nivel 1 ✓ (diastólica en rango)
  - 145/92 mmHg → Nivel 1 ✓ (ambas en rango)
  - 141/87 mmHg → Nivel 1 ✓ (caso real PEREYRA ISABEL)
  - 130/80 mmHg → Nivel 1 ✓ (límite inferior)
  - 159/99 mmHg → Nivel 1 ✓ (límite superior)

---

### 4. **Hipertensión Nivel 2**

- **Criterio**: SYS ≥160 **O** DIA ≥100
- **Ejemplos**:
  - 165/95 mmHg → Nivel 2 ✓ (sistólica ≥160)
  - 155/105 mmHg → Nivel 2 ✓ (diastólica ≥100)
  - 170/110 mmHg → Nivel 2 ✓ (ambas en rango)
  - 160/90 mmHg → Nivel 2 ✓ (límite sistólica)
  - 150/100 mmHg → Nivel 2 ✓ (límite diastólica)
  - 148/90 mmHg → Nivel 2 ✓ (caso real VILLAFAÑE NATALIA)

---

### 5. **Hipertensión Sistólica Aislada**

- **Criterio**: SYS ≥140 **Y** DIA < 80
- **Ejemplos**:
  - 145/75 mmHg → Sistólica Aislada ✓
  - 160/70 mmHg → Sistólica Aislada ✓
  - 140/79 mmHg → Sistólica Aislada ✓
- **Nota**: Si la diastólica es ≥80, se clasifica como Nivel 1 o 2 según corresponda

---

## 🧪 Casos Límite y Especiales

### Casos de Transición

| SYS/DIA | Clasificación     | Motivo                     |
| ------- | ----------------- | -------------------------- |
| 120/79  | Elevada           | SYS en 120-129 y DIA <80   |
| 120/80  | Nivel 1           | DIA ≥80                    |
| 129/79  | Elevada           | SYS <130 y DIA <80         |
| 130/79  | Nivel 1           | SYS ≥130                   |
| 139/89  | Nivel 1           | Ambas en rango Nivel 1     |
| 140/79  | Sistólica Aislada | SYS ≥140 pero DIA <80      |
| 140/80  | Nivel 1           | DIA ≥80 (ya no es aislada) |
| 159/99  | Nivel 1           | Límite superior Nivel 1    |
| 160/99  | Nivel 2           | SYS ≥160                   |
| 159/100 | Nivel 2           | DIA ≥100                   |

---

## 📋 Casos Reales Probados

### Caso 1: BARRIOS ANTONIA

- **Valores**: 161/99 mmHg
- **Clasificación**: Hipertensión Nivel 2 ✓
- **Motivo**: SYS 161 ≥160

### Caso 2: VILLAFAÑE NATALIA

- **Valores**: 148/90 mmHg
- **Clasificación**: Hipertensión Nivel 2 ✓
- **Motivo**: SYS 148 ≥140 Y DIA 90 ≥90

### Caso 3: PEREYRA ISABEL

- **Valores**: 141/87 mmHg
- **Clasificación**: Hipertensión Nivel 1 ✓
- **Motivo**: SYS 141 en rango 130-159 Y DIA 87 en rango 80-99

---

## ⚠️ Preguntas para el Doctor

Por favor, validar las siguientes decisiones de diseño:

### 1. Clasificación OR vs AND

**Pregunta**: ¿La lógica actual es correcta?

- Nivel 1: Se clasifica si **cualquiera** de los dos valores está en rango (130-159 **O** 80-99)
- Nivel 2: Se clasifica si **cualquiera** de los dos valores está en rango (≥160 **O** ≥100)

**Alternativa**: ¿Debería requerir que **ambos** valores estén en el mismo nivel?

---

### 2. Hipertensión Sistólica Aislada

**Pregunta**: ¿El umbral de diastólica <80 es correcto?

- Actual: Solo es "Sistólica Aislada" si DIA <80
- Si DIA ≥80: Se clasifica como Nivel 1 o 2

¿Es correcto o debería ser DIA <90?

---

### 3. Rangos de Clasificación

**Pregunta**: ¿Los rangos implementados coinciden con la práctica clínica?

| Categoría         | Sistólica | Diastólica |
| ----------------- | --------- | ---------- |
| Normal            | <120      | Y <80      |
| Elevada           | 120-129   | Y <80      |
| Nivel 1           | 130-159   | O 80-99    |
| Nivel 2           | ≥160      | O ≥100     |
| Sistólica Aislada | ≥140      | Y <80      |

---

### 4. Prioridad de Clasificación

**Pregunta**: ¿El orden de prioridad es correcto?

Orden actual:

1. Primero verifica Sistólica Aislada (SYS ≥140 y DIA <80)
2. Luego verifica Nivel 2 (≥160 o ≥100)
3. Luego verifica Nivel 1 (130-159 o 80-99)
4. Luego verifica Elevada (120-129 y <80)
5. Finalmente Normal (<120 y <80)

---

## 🔄 Duración del Estudio

### Lógica Actual

- **Cualquier duración ≥24 horas**: Se redondea a **24 horas**
- **Duración <24 horas**: Se redondea según minutos (≥30 min suma 1 hora)

### Ejemplos

- 23H45M → 24 horas ✓
- 24H00M → 24 horas ✓
- 25H32M → 24 horas ✓
- 26H15M → 24 horas ✓
- 48H00M → 24 horas ✓
- 23H20M → 23 horas ✓
- 22H50M → 23 horas ✓

---

## ✅ Validación Requerida

Por favor, revisar y confirmar:

- [ ] La lógica de clasificación es correcta
- [ ] Los rangos coinciden con guías médicas actuales
- [ ] El manejo de casos límite es apropiado
- [ ] La duración máxima de 24 horas es correcta

---

**Documento generado**: 26/11/2025  
**Sistema**: Informatron v1.0  
**Archivo**: `back/functions/calculations.js`
