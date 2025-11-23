'use client';

import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAllProperties, usePropertiesWithSales, formatTokenAmount, formatBasisPoints, getPropertyStatusText } from '@/hooks/usePropertyRegistry';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import { PropertyWithSale } from '@/lib/contracts';

// Helper function to transform blockchain data to component format
function transformPropertyData(propertyWithSale: PropertyWithSale, index: number) {
  const { property, sale, saleIsActive } = propertyWithSale;

  // Calculate funded percentage
  const totalInvestmentTarget = Number(property.totalInvestmentTarget);
  const totalRaised = Number(sale.totalRaised);
  const funded = totalInvestmentTarget > 0
    ? Math.min(Math.round((totalRaised / totalInvestmentTarget) * 100), 100)
    : 0;

  // Calculate estimated APY from ROI (simplified)
  const estimatedSalePrice = Number(property.estimatedSalePrice);
  const roi = totalInvestmentTarget > 0
    ? ((estimatedSalePrice - totalInvestmentTarget) / totalInvestmentTarget) * 100
    : 0;
  const apy = roi > 0 ? roi / 5 : 0; // Simplified: assume 5 year holding period

  // Format price per token (USDC has 6 decimals)
  const pricePerToken = formatTokenAmount(sale.pricePerToken, 6);

  // Determine property type from status
  const statusText = getPropertyStatusText(property.status);
  const type = property.units > BigInt(10) ? 'RESIDENTIAL' : 'COMMERCIAL';

  return {
    id: property.token,
    type: type,
    title: property.name,
    location: property.location,
    apy: apy,
    price: pricePerToken,
    funded: funded,
    image: property.ipfsHash
      ? `https://ipfs.io/ipfs/${property.ipfsHash}`
      : `https://images.unsplash.com/photo-${1486406146926 + index}?q=80&w=800&auto=format&fit=crop`,
    tokenAddress: property.token,
    isActive: saleIsActive,
    status: statusText,
  };
}

// --- 1. Componente: La Tarjeta de Propiedad (El diseño interno) ---
const PropertyCard = ({ data }: { data: any }) => {
    const router = useRouter();

    const handleClick = () => {
        router.push(`/marketplace/${data.id}`);
    };

    return (
        <div
            onClick={handleClick}
            className="relative bg-white border-2 border-black rounded-[30px] p-5 w-full max-w-[600px] overflow-hidden z-10 flex flex-col justify-between cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
            style={{ minHeight: '420px' }}
        >
            {/* Header: Tag & Image */}
            <div className="space-y-3 mb-4">
                <div className="relative h-40 w-full rounded-2xl overflow-hidden border border-black/10">
                    {/* Etiqueta flotante */}
                    <div className="absolute top-3 left-3 bg-white border border-black px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide z-10 text-black">
                        {data.type}
                    </div>
                    {/* Imagen en escala de grises (Grayscale) según referencia */}
                    <img
                        src={data.image}
                        alt={data.title}
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                    />
                </div>

                {/* Título y Ubicación */}
                <div>
                    <h3 className="text-2xl font-normal leading-tight text-black mb-1 font-sans tracking-tight">
                        {data.title.split(" ").map((word: string, i: number) => (
                            <span key={i} className="block">{word}</span>
                        ))}
                    </h3>
                    <div className="flex items-center gap-1 text-black/60 text-sm">
                        <MapPin className="w-3 h-3" />
                        <span>{data.location}</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="space-y-4">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[10px] font-bold uppercase text-black/50 mb-1">EST. APY</p>
                        <p className="text-lg font-bold text-black">{data.apy}%</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold uppercase text-black/50 mb-1">TOKEN PRICE</p>
                        <p className="text-lg font-bold text-black">${data.price}</p>
                    </div>
                </div>

                {/* Barra de Progreso */}
                <div>
                    <div className="flex justify-between text-xs font-bold mb-2">
                        <span>Funded</span>
                        <span>{data.funded}%</span>
                    </div>
                    <div className="w-full h-[2px] bg-black/10 rounded-full">
                        <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${data.funded}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-black rounded-full"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 2. Wrapper para Items Impares (Fondo Azul Claro / Izquierda) ---
const OddItem = ({ data }: { data: any }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="relative w-full justify-end flex overflow-hidden"
        >
            <img style={{ transform: 'scaleY(1.6) scaleX(1.5)' }} src="/recurso2.svg" className="absolute top-0 left-0 w-full h-full -z-0 pointer-events-none" />
            <div className="ml-[5%] md:ml-[10%] py-8 w-full flex justify-start">
                <PropertyCard data={data} />
            </div>
        </motion.div>
    );
};

// --- 3. Wrapper para Items Pares (Fondo Azul Oscuro / Derecha) ---
const EvenItem = ({ data }: { data: any }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="relative w-full flex justify-start overflow-hidden"
        >
            <img style={{ transform: 'scaleY(1.6) scaleX(1.5)' }}
                src="/recurso1.svg" className="absolute top-0 right-0 w-full h-full -z-0 pointer-events-none" />
            <div className="mr-[5%] md:mr-[10%] py-8 w-full flex justify-end">
                <PropertyCard data={data} />
            </div>
        </motion.div>
    );
};

interface MarketplaceListProps {
    searchQuery?: string;
    category?: string;
    filters?: {
        minPrice?: number;
        maxPrice?: number;
        minAPY?: number;
        maxAPY?: number;
        minFunded?: number;
        maxFunded?: number;
    };
}

// Datos de propiedades ampliados
const ALL_PROPERTIES = [
    {
        id: 1,
        type: "COMMERCIAL",
        title: "Skyline Commercial Tower",
        location: "Buenos Aires, Palermo",
        apy: 12.4,
        price: "50.00",
        funded: 78,
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: 2,
        type: "RESIDENTIAL",
        title: "Sunset Boulevard Apt",
        location: "Miami, Brickell",
        apy: 10.2,
        price: "45.00",
        funded: 45,
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: 3,
        type: "INDUSTRIAL",
        title: "Logistics Hub Alpha",
        location: "Mexico City, Santa Fe",
        apy: 14.1,
        price: "100.00",
        funded: 92,
        image: "https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: 4,
        type: "RESIDENTIAL",
        title: "Luxury Beach Villa",
        location: "Cancun, Mexico",
        apy: 9.5,
        price: "75.00",
        funded: 62,
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: 5,
        type: "COMMERCIAL",
        title: "Tech Park Office Space",
        location: "Austin, Texas",
        apy: 11.8,
        price: "60.00",
        funded: 85,
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: 6,
        type: "RESIDENTIAL",
        title: "Mountain View Residence",
        location: "Denver, Colorado",
        apy: 8.9,
        price: "55.00",
        funded: 55,
        image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: 7,
        type: "INDUSTRIAL",
        title: "Distribution Center",
        location: "Singapore",
        apy: 13.2,
        price: "90.00",
        funded: 95,
        image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: 8,
        type: "COMMERCIAL",
        title: "Retail Shopping Plaza",
        location: "Madrid, Spain",
        apy: 10.7,
        price: "65.00",
        funded: 70,
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: 9,
        type: "RESIDENTIAL",
        title: "Urban Loft Complex",
        location: "Brooklyn, New York",
        apy: 9.8,
        price: "80.00",
        funded: 88,
        image: "https://images.unsplash.com/photo-1502672260066-6bc35f0cdeae?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: 10,
        type: "INDUSTRIAL",
        title: "Renewable Energy Facility",
        location: "Oslo, Norway",
        apy: 15.3,
        price: "120.00",
        funded: 42,
        image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: 11,
        type: "COMMERCIAL",
        title: "Downtown Hotel",
        location: "Paris, France",
        apy: 11.2,
        price: "95.00",
        funded: 68,
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop"
    },
    {
        id: 12,
        type: "RESIDENTIAL",
        title: "Coastal Apartments",
        location: "Barcelona, Spain",
        apy: 10.5,
        price: "70.00",
        funded: 75,
        image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800&auto=format&fit=crop"
    }
];

// --- 4. Componente Principal: La Lista del Marketplace ---
export default function MarketplaceList({ searchQuery = '', category = 'All', filters = {} }: MarketplaceListProps) {
    // Fetch all property addresses from blockchain
    const { propertyAddresses, isLoading: isLoadingAddresses, error: errorAddresses } = useAllProperties();

    // Fetch detailed property and sale information
    const { properties: blockchainProperties, isLoading: isLoadingProperties, error: errorProperties, refetch } = usePropertiesWithSales(propertyAddresses);

    // Show loading state
    if (isLoadingAddresses || isLoadingProperties) {
        return <LoadingState />;
    }

    // Show error state
    if (errorAddresses || errorProperties) {
        return <ErrorState error={errorAddresses || errorProperties} onRetry={refetch} />;
    }

    // Transform blockchain data to component format
    const transformedProperties = blockchainProperties?.map((prop, index) => transformPropertyData(prop, index)) || [];

    // Filtrar propiedades basado en búsqueda, categoría y filtros
    const properties = transformedProperties.filter(property => {
        // Filtro de búsqueda
        const matchesSearch = !searchQuery ||
            property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            property.type.toLowerCase().includes(searchQuery.toLowerCase());

        // Filtro de categoría
        const matchesCategory = category === 'All' || property.type.toUpperCase() === category.toUpperCase();

        // Filtros avanzados
        const price = parseFloat(property.price);
        const matchesPrice = (!filters.minPrice || price >= filters.minPrice) &&
                            (!filters.maxPrice || price <= filters.maxPrice);

        const matchesAPY = (!filters.minAPY || property.apy >= filters.minAPY) &&
                          (!filters.maxAPY || property.apy <= filters.maxAPY);

        const matchesFunded = (!filters.minFunded || property.funded >= filters.minFunded) &&
                             (!filters.maxFunded || property.funded <= filters.maxFunded);

        return matchesSearch && matchesCategory && matchesPrice && matchesAPY && matchesFunded;
    });

    return (
        <section className="bg-[#FFFBF5] py-12 overflow-x-hidden">
            <div className="w-full max-w-full overflow-x-hidden">

                {properties.length > 0 ? (
                    <div className="flex flex-col gap-[10px]">
                        {properties.map((property, index) => {
                            // Lógica para alternar (index + 1 para que el primero sea impar 1, segundo par 2, etc.)
                            const isEven = (index + 1) % 2 === 0;

                            return isEven ? (
                                <EvenItem key={property.id} data={property} />
                            ) : (
                                <OddItem key={property.id} data={property} />
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-2xl font-bold text-[#2A2F5B] mb-2">No properties found</h3>
                        <p className="text-black/60">Try adjusting your search or filters</p>
                    </div>
                )}

            </div>
        </section>
    );
}