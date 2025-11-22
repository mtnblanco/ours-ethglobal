'use client';

import React from 'react';
import { motion } from 'framer-motion';

// Componente optimizado exclusivamente para Mobile (columna única)
export default function RegulatedSectionMobile() {
    // Definiciones de color (iguales al diseño original)
    const COLOR_DARK = '#1E2046';
    const COLOR_LIGHT_BLUE = '#B0C9FF';
    const COLOR_CREAM = '#FDFBF7';

    // Altura asumida del SVG para calcular el solapamiento
    // Si el SVG tiene aprox 100px de altura, un solapamiento del 5% es 5px.
    const MARGIN_SOLAPAMIENTO = '5px';

    return (
        <section className="w-full font-sans text-xl" style={{ backgroundColor: COLOR_CREAM }}>

            {/* --- PARTE SUPERIOR: FEATURES (Fondo Crema) --- */}
            {/* Padding superior mínimo (pt-8) */}
            <div className="-mt-[10%] pb-0">    // Porcentaje negativo
                <div className="container mx-auto px-6">

                    {/* Contenedor principal de Features */}
                    <div className="flex flex-row items-stretch gap-3">

                        {/* COLUMNA 1: El Asset SVG (Recurso 3) */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            className="flex-shrink-0"
                            // Aplica solapamiento superior e inferior negativo a esta sección
                            style={{
                                marginTop: `-${MARGIN_SOLAPAMIENTO}`,
                                marginBottom: `-${MARGIN_SOLAPAMIENTO}`
                            }}
                        >
                            {/* Ajustar altura según el SVG real. h-[140px] es un buen punto de partida para móvil. */}
                            <img
                                src="/recurso3.svg"
                                alt="Features Icon"
                                className="h-[140px] w-auto object-contain relative z-[100]"
                            />
                        </motion.div>

                        {/* COLUMNA 2: Textos alineados y DESPLAZADOS */}
                        <div className="flex flex-col justify-between py-2 w-full pr-4">

                            {/* Texto Superior: Accessible Marketplace (Desplazado a la izquierda) */}
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1, duration: 0.5 }}
                                className="flex items-center h-1/2"
                            >
                                {/* Se usa ml-[-20px] para empujar ligeramente a la izquierda */}
                                <h3 className="text-xl font-medium" style={{ color: COLOR_DARK, marginLeft: '-20px' }}>
                                    Accessible Marketplace
                                </h3>
                            </motion.div>

                            {/* Texto Inferior: Secondary Liquidity (Más centrado/menos desplazado a la izquierda) */}
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2, duration: 0.5 }}
                                className="flex items-center h-1/2"
                            >
                                {/* Se usa ml-[-5px] para empujar ligeramente, pero menos que el superior */}
                                <h3 className="text-xl font-medium" style={{ color: COLOR_DARK, marginLeft: '-5px' }}>
                                    Secondary Liquidity
                                </h3>
                            </motion.div>
                        </div>

                    </div>
                </div>
            </div>

        </section>
    );
}