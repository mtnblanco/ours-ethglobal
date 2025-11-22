/**
 * Script para generar Merkle Tree para distribución de ganancias
 * 
 * Uso:
 * node scripts/generate-merkle-tree.js
 * 
 * Este script:
 * 1. Lee un archivo CSV/JSON con holders y sus cantidades
 * 2. Genera el merkle tree
 * 3. Guarda el merkleRoot y las pruebas para cada holder
 */

import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';
import { ethers, parseUnits, formatUnits, solidityPackedKeccak256, ZeroAddress } from 'ethers';
import fs from 'fs';
import path from 'path';

/**
 * Ejemplo de datos de holders
 * En producción, esto vendría de:
 * - Eventos del token ERC-3643
 * - TheGraph subgraph
 * - Base de datos off-chain
 */
const EXAMPLE_HOLDERS = [
    {
        address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
        amount: parseUnits('100', 6) // 100 USDC (6 decimales)
    },
    {
        address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
        amount: parseUnits('250', 6) // 250 USDC
    },
    {
        address: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
        amount: parseUnits('150', 6) // 150 USDC
    },
    {
        address: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
        amount: parseUnits('500', 6) // 500 USDC
    }
];

/**
 * Genera un leaf del merkle tree para un holder
 * Debe coincidir exactamente con la lógica del contrato
 */
function generateLeaf(address, amount) {
    // Mismo formato que en el contrato:
    // keccak256(abi.encodePacked(address, amount))
    return solidityPackedKeccak256(
        ['address', 'uint256'],
        [address, amount]
    );
}

/**
 * Genera el merkle tree completo
 */
function generateMerkleTree(holders) {
    console.log('📊 Generando Merkle Tree...\n');
    
    // 1. Generar leaves
    const leaves = holders.map(holder => 
        generateLeaf(holder.address, holder.amount)
    );
    
    console.log(`✅ Generados ${leaves.length} leaves\n`);
    
    // 2. Crear el árbol
    const tree = new MerkleTree(leaves, keccak256, { 
        sortPairs: true // Importante: ordenar pares para consistencia
    });
    
    // 3. Obtener el root
    const root = tree.getHexRoot();
    
    console.log('🌳 Merkle Tree generado:');
    console.log('Root:', root);
    console.log('\n📝 Árbol completo:');
    console.log(tree.toString());
    console.log('\n');
    
    return { tree, root, leaves };
}

/**
 * Genera proofs para cada holder
 */
function generateProofs(tree, holders, leaves) {
    console.log('🔐 Generando proofs para cada holder...\n');
    
    const proofs = holders.map((holder, index) => {
        const leaf = leaves[index];
        const proof = tree.getHexProof(leaf);
        
        return {
            address: holder.address,
            amount: holder.amount.toString(),
            amountFormatted: formatUnits(holder.amount, 6) + ' USDC',
            proof: proof,
            leaf: leaf
        };
    });
    
    return proofs;
}

/**
 * Guarda el resultado en archivos JSON
 */
function saveResults(root, proofs, totalAmount, outputDir = './merkle-distributions') {
    // Crear directorio si no existe
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `distribution-${timestamp}`;
    
    // Guardar información completa
    const distributionData = {
        merkleRoot: root,
        totalAmount: totalAmount.toString(),
        totalAmountFormatted: formatUnits(totalAmount, 6) + ' USDC',
        holdersCount: proofs.length,
        generatedAt: new Date().toISOString(),
        holders: proofs
    };
    
    const fullPath = path.join(outputDir, `${filename}.json`);
    fs.writeFileSync(fullPath, JSON.stringify(distributionData, null, 2));
    
    console.log(`💾 Resultados guardados en: ${fullPath}\n`);
    
    // Guardar solo el root (para el contrato)
    const rootPath = path.join(outputDir, `${filename}-root.txt`);
    fs.writeFileSync(rootPath, root);
    
    return fullPath;
}

/**
 * Verifica un proof contra el root
 */
function verifyProof(root, address, amount, proof) {
    const leaf = generateLeaf(address, amount);
    const tree = new MerkleTree([], keccak256, { sortPairs: true });
    
    // Reconstruir el camino
    let computedHash = leaf;
    for (const proofElement of proof) {
        const buf = Buffer.from(computedHash.slice(2), 'hex');
        const proofBuf = Buffer.from(proofElement.slice(2), 'hex');
        
        if (buf.compare(proofBuf) < 0) {
            computedHash = '0x' + keccak256(
                Buffer.concat([buf, proofBuf])
            ).toString('hex');
        } else {
            computedHash = '0x' + keccak256(
                Buffer.concat([proofBuf, buf])
            ).toString('hex');
        }
    }
    
    return computedHash === root;
}

/**
 * Función principal
 */
async function main() {
    console.log('🚀 Merkle Tree Generator para RevenueDistributor\n');
    console.log('='.repeat(60) + '\n');
    
    // 1. Preparar datos
    const holders = EXAMPLE_HOLDERS;
    const totalAmount = holders.reduce((sum, h) => sum + h.amount, 0n);
    
    console.log('📊 Resumen de la distribución:');
    console.log(`   Holders: ${holders.length}`);
    console.log(`   Total a distribuir: ${formatUnits(totalAmount, 6)} USDC`);
    console.log('\n');
    
    // 2. Generar merkle tree
    const { tree, root, leaves } = generateMerkleTree(holders);
    
    // 3. Generar proofs
    const proofs = generateProofs(tree, holders, leaves);
    
    // 4. Mostrar resultados
    console.log('📋 Detalles por holder:');
    console.log('─'.repeat(60));
    proofs.forEach((p, index) => {
        console.log(`\n${index + 1}. ${p.address}`);
        console.log(`   Cantidad: ${p.amountFormatted}`);
        console.log(`   Proof length: ${p.proof.length} elementos`);
        
        // Verificar el proof
        const isValid = verifyProof(root, p.address, holders[index].amount, p.proof);
        console.log(`   Verificación: ${isValid ? '✅ Válido' : '❌ Inválido'}`);
    });
    console.log('\n' + '─'.repeat(60) + '\n');
    
    // 5. Guardar resultados
    const outputPath = saveResults(root, proofs, totalAmount);
    
    // 6. Mostrar instrucciones
    console.log('📝 Siguientes pasos:\n');
    console.log('1. Transfiere el USDC total al contrato o aprúebalo');
    console.log(`   Cantidad: ${formatUnits(totalAmount, 6)} USDC`);
    console.log('\n2. Llama a setupDistribution() con:');
    console.log(`   token: <dirección del token ERC-3643>`);
    console.log(`   merkleRoot: ${root}`);
    console.log(`   totalAmount: ${totalAmount.toString()}`);
    console.log('\n3. Los holders pueden reclamar llamando a claim() con:');
    console.log(`   - Su address (automático como msg.sender)`);
    console.log(`   - Su amount (disponible en ${outputPath})`);
    console.log(`   - Su proof (disponible en ${outputPath})`);
    console.log('\n');
    console.log('✅ Proceso completado!\n');
}

// Ejecutar script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });

export {
    generateLeaf,
    generateMerkleTree,
    generateProofs,
    verifyProof
};

