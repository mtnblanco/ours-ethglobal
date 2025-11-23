# 🚀 Comandos para Ejecutar el Workflow

## 1. Verificar que estás en el directorio correcto

```bash
cd /Users/mtn/Desktop/ours-eth
```

## 2. Configurar el PATH con Bun y CRE CLI

```bash
export PATH="$HOME/.bun/bin:$PATH"
export PATH="/Users/mtn/Desktop/ours-eth/contracts/chainlink-cre:$PATH"
```

## 3. Verificar que todo está instalado

```bash
# Verificar Bun
bun --version

# Verificar CRE CLI
cre --version

# Verificar que estás logueado en CRE
cre login
```

## 4. Ir al directorio del workflow

```bash
cd /Users/mtn/Desktop/ours-eth/ours
```

## 5. Instalar dependencias del workflow (si no lo hiciste antes)

```bash
cd /Users/mtn/Desktop/ours-eth/ours/ours
bun install
```

## 6. Compilar el workflow (verificar que funciona)

```bash
cd /Users/mtn/Desktop/ours-eth/ours/ours
bun build main.ts --outdir dist --target=bun
```

## 7. Simular el workflow

```bash
cd /Users/mtn/Desktop/ours-eth/ours
export PATH="$HOME/.bun/bin:$PATH"
export PATH="/Users/mtn/Desktop/ours-eth/contracts/chainlink-cre:$PATH"
cre workflow simulate ./ours --target=staging-settings
```

---

## ⚠️ Nota sobre la Simulación

La simulación requiere un evento real emitido en la blockchain. Si quieres simular con un evento real:

1. Primero emite un evento llamando a `mockRequestKYCForTesting()` en el contrato
2. Obtén el hash de la transacción
3. Simula con ese hash:

```bash
cre workflow simulate ./ours --target=staging-settings --trigger-index=0 --evm-tx-hash <TU_TX_HASH>
```

---

## 📋 Todo en un solo comando (copia y pega)

```bash
cd /Users/mtn/Desktop/ours-eth/ours && \
export PATH="$HOME/.bun/bin:$PATH" && \
export PATH="/Users/mtn/Desktop/ours-eth/contracts/chainlink-cre:$PATH" && \
cre workflow simulate ./ours --target=staging-settings
```

---

## 🎯 Para la Hackathon - Mostrar que funciona

Si quieres mostrar que el workflow compila:

```bash
cd /Users/mtn/Desktop/ours-eth/ours/ours && \
export PATH="$HOME/.bun/bin:$PATH" && \
bun build main.ts --outdir dist --target=bun
```

Esto mostrará: `✅ Bundled 516 modules` - demostrando que el código está correcto.

