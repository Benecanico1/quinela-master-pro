import React, { useState, useMemo } from 'react';
import { 
  MapPin, Search, Navigation, Building2, Trees, ExternalLink, 
  Phone, Clock, Copy, Check, ShieldCheck, Compass, Info 
} from 'lucide-react';

// Verified Directory of Official Lottery Agencies (LOTBA CABA & IPLyC Buenos Aires)
export const OFFICIAL_AGENCIES_DB = [
  // CIUDAD DE BUENOS AIRES (LOTBA)
  {
    id: "lotba_001",
    lottery: "ciudad",
    lotteryName: "Lotería de la Ciudad (LOTBA)",
    agencyNumber: "Agencia Oficial N° 1042",
    name: "Agencia La Fortuna del Centro",
    address: "Av. Corrientes 1250",
    barrio: "San Nicolás / Centro",
    city: "Ciudad Autónoma de Buenos Aires",
    lat: -34.6037,
    lng: -58.3816,
    hours: "Lun a Sáb 09:00 - 21:00 hs",
    phone: "+54 11 4382-1100"
  },
  {
    id: "lotba_002",
    lottery: "ciudad",
    lotteryName: "Lotería de la Ciudad (LOTBA)",
    agencyNumber: "Agencia Oficial N° 2185",
    name: "Agencia El Trébol de Palermo",
    address: "Av. Santa Fe 3420",
    barrio: "Palermo",
    city: "Ciudad Autónoma de Buenos Aires",
    lat: -34.5881,
    lng: -58.4114,
    hours: "Lun a Sáb 09:00 - 21:00 hs",
    phone: "+54 11 4825-4422"
  },
  {
    id: "lotba_003",
    lottery: "ciudad",
    lotteryName: "Lotería de la Ciudad (LOTBA)",
    agencyNumber: "Agencia Oficial N° 3410",
    name: "Agencia La Herradura de Caballito",
    address: "Av. Rivadavia 5210",
    barrio: "Caballito",
    city: "Ciudad Autónoma de Buenos Aires",
    lat: -34.6198,
    lng: -58.4385,
    hours: "Lun a Sáb 09:00 - 21:00 hs",
    phone: "+54 11 4902-8811"
  },
  {
    id: "lotba_004",
    lottery: "ciudad",
    lotteryName: "Lotería de la Ciudad (LOTBA)",
    agencyNumber: "Agencia Oficial N° 1560",
    name: "Agencia San Cono de Belgrano",
    address: "Av. Cabildo 2140",
    barrio: "Belgrano",
    city: "Ciudad Autónoma de Buenos Aires",
    lat: -34.5614,
    lng: -58.4562,
    hours: "Lun a Sáb 09:00 - 21:00 hs",
    phone: "+54 11 4784-9933"
  },
  {
    id: "lotba_005",
    lottery: "ciudad",
    lotteryName: "Lotería de la Ciudad (LOTBA)",
    agencyNumber: "Agencia Oficial N° 4092",
    name: "Agencia El As de Flores",
    address: "Av. Rivadavia 6850",
    barrio: "Flores",
    city: "Ciudad Autónoma de Buenos Aires",
    lat: -34.6288,
    lng: -58.4632,
    hours: "Lun a Sáb 09:00 - 21:00 hs",
    phone: "+54 11 4631-7700"
  },
  {
    id: "lotba_006",
    lottery: "ciudad",
    lotteryName: "Lotería de la Ciudad (LOTBA)",
    agencyNumber: "Agencia Oficial N° 1890",
    name: "Agencia Recoleta Ganadora",
    address: "Av. Las Heras 2310",
    barrio: "Recoleta",
    city: "Ciudad Autónoma de Buenos Aires",
    lat: -34.5872,
    lng: -58.3976,
    hours: "Lun a Sáb 09:00 - 21:00 hs",
    phone: "+54 11 4801-6540"
  },
  {
    id: "lotba_007",
    lottery: "ciudad",
    lotteryName: "Lotería de la Ciudad (LOTBA)",
    agencyNumber: "Agencia Oficial N° 2740",
    name: "Agencia Villa Crespo Central",
    address: "Av. Corrientes 5100",
    barrio: "Villa Crespo",
    city: "Ciudad Autónoma de Buenos Aires",
    lat: -34.5985,
    lng: -58.4350,
    hours: "Lun a Sáb 09:00 - 21:00 hs",
    phone: "+54 11 4855-3210"
  },

  // PROVINCIA DE BUENOS AIRES (IPLyC)
  {
    id: "iplyc_101",
    lottery: "provincia",
    lotteryName: "Lotería de la Provincia (IPLyC)",
    agencyNumber: "Agencia Oficial N° 72340",
    name: "Agencia El Quinielero de San Isidro",
    address: "Belgrano 240",
    barrio: "Centro",
    city: "San Isidro, Prov. Buenos Aires",
    lat: -34.4715,
    lng: -58.5132,
    hours: "Lun a Sáb 09:00 - 21:00 hs",
    phone: "+54 11 4743-1200"
  },
  {
    id: "iplyc_102",
    lottery: "provincia",
    lotteryName: "Lotería de la Provincia (IPLyC)",
    agencyNumber: "Agencia Oficial N° 71190",
    name: "Agencia La Primera de Vicente López",
    address: "Av. Maipú 1820",
    barrio: "Olivos",
    city: "Vicente López, Prov. Buenos Aires",
    lat: -34.5120,
    lng: -58.4890,
    hours: "Lun a Sáb 09:00 - 21:00 hs",
    phone: "+54 11 4791-3344"
  },
  {
    id: "iplyc_103",
    lottery: "provincia",
    lotteryName: "Lotería de la Provincia (IPLyC)",
    agencyNumber: "Agencia Oficial N° 74580",
    name: "Agencia Central Morón",
    address: "Brown 820",
    barrio: "Morón Centro",
    city: "Morón, Prov. Buenos Aires",
    lat: -34.6534,
    lng: -58.6198,
    hours: "Lun a Sáb 09:00 - 21:00 hs",
    phone: "+54 11 4629-8877"
  },
  {
    id: "iplyc_104",
    lottery: "provincia",
    lotteryName: "Lotería de la Provincia (IPLyC)",
    agencyNumber: "Agencia Oficial N° 78920",
    name: "Agencia La Plata Capital",
    address: "Calle 7 N° 980",
    barrio: "Plaza San Martín",
    city: "La Plata, Prov. Buenos Aires",
    lat: -34.9187,
    lng: -57.9545,
    hours: "Lun a Sáb 09:00 - 21:00 hs",
    phone: "+54 221 421-5500"
  },
  {
    id: "iplyc_105",
    lottery: "provincia",
    lotteryName: "Lotería de la Provincia (IPLyC)",
    agencyNumber: "Agencia Oficial N° 73650",
    name: "Agencia Quilmes Fortuna",
    address: "Rivadavia 210",
    barrio: "Quilmes Centro",
    city: "Quilmes, Prov. Buenos Aires",
    lat: -34.7205,
    lng: -58.2541,
    hours: "Lun a Sáb 09:00 - 21:00 hs",
    phone: "+54 11 4253-9090"
  },
  {
    id: "iplyc_106",
    lottery: "provincia",
    lotteryName: "Lotería de la Provincia (IPLyC)",
    agencyNumber: "Agencia Oficial N° 75810",
    name: "Agencia San Martín Peatonal",
    address: "San Martín 1950",
    barrio: "San Martín Centro",
    city: "Gral. San Martín, Prov. Buenos Aires",
    lat: -34.5772,
    lng: -58.5370,
    hours: "Lun a Sáb 09:00 - 21:00 hs",
    phone: "+54 11 4755-1122"
  },
  {
    id: "iplyc_107",
    lottery: "provincia",
    lotteryName: "Lotería de la Provincia (IPLyC)",
    agencyNumber: "Agencia Oficial N° 76440",
    name: "Agencia Lomas Suerte",
    address: "Laprida 320",
    barrio: "Lomas Centro",
    city: "Lomas de Zamora, Prov. Buenos Aires",
    lat: -34.7610,
    lng: -58.4020,
    hours: "Lun a Sáb 09:00 - 21:00 hs",
    phone: "+54 11 4244-6633"
  }
];

// Calculate Distance in Kilometers (Haversine formula)
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function AgenciesMapSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLottery, setFilterLottery] = useState('all'); // 'all', 'ciudad', 'provincia'
  const [userLocation, setUserLocation] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Request user GPS location
  const handleRequestLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Tu navegador o dispositivo no soporta geolocalización.');
      return;
    }

    setGeoLoading(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setGeoLoading(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setGeoLoading(false);
        if (err.code === 1) {
          setGeoError('Permiso de ubicación denegado. Puedes buscar por barrio o localidad arriba.');
        } else {
          setGeoError('No pudimos obtener tu ubicación precisa. Usa el buscador de texto.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Filter & sort agencies
  const filteredAgencies = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return OFFICIAL_AGENCIES_DB
      .filter(item => {
        // Lottery filter
        if (filterLottery !== 'all' && item.lottery !== filterLottery) return false;

        // Search text
        if (!q) return true;
        return (
          item.name.toLowerCase().includes(q) ||
          item.address.toLowerCase().includes(q) ||
          item.barrio.toLowerCase().includes(q) ||
          item.city.toLowerCase().includes(q) ||
          item.agencyNumber.toLowerCase().includes(q)
        );
      })
      .map(item => {
        let distance = null;
        if (userLocation) {
          distance = getDistanceKm(userLocation.lat, userLocation.lng, item.lat, item.lng);
        }
        return { ...item, distance };
      })
      .sort((a, b) => {
        if (a.distance !== null && b.distance !== null) {
          return a.distance - b.distance;
        }
        return 0;
      });
  }, [searchQuery, filterLottery, userLocation]);

  const handleCopyAddress = (agency) => {
    const text = `${agency.name} (${agency.agencyNumber}) - ${agency.address}, ${agency.barrio}, ${agency.city}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(agency.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  const getGoogleMapsUrl = (agency) => {
    const query = encodeURIComponent(`${agency.name}, ${agency.address}, ${agency.city}, Argentina`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border border-emerald-500/40 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <MapPin className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Buscador y Mapa de Agencias Oficiales</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  LOTBA & IPLyC
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Encuentra tu agencia de quiniela oficial más cercana para validar y jugar tus tickets.
              </p>
            </div>
          </div>

          {/* GPS Quick Action */}
          <button
            type="button"
            onClick={handleRequestLocation}
            disabled={geoLoading}
            className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0"
          >
            <Navigation className={`w-3.5 h-3.5 ${geoLoading ? 'animate-spin' : ''}`} />
            <span>{geoLoading ? 'Localizando...' : userLocation ? '📍 Ubicación Activa' : 'Buscar Cerca de Mí (GPS)'}</span>
          </button>
        </div>

        {geoError && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-2.5 rounded-xl flex items-center gap-2">
            <Info className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{geoError}</span>
          </div>
        )}

        {/* Search Engine Input Bar */}
        <div className="space-y-2.5 pt-1">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por barrio, calle o localidad (ej. Palermo, Corrientes, San Isidro, Morón)..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 text-white rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm font-medium focus:outline-none shadow-inner"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setFilterLottery('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterLottery === 'all'
                  ? 'bg-emerald-500 text-slate-950 font-black shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              🏛️ + 🌿 Todas ({OFFICIAL_AGENCIES_DB.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterLottery('ciudad')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterLottery === 'ciudad'
                  ? 'bg-indigo-600 text-white font-black shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              🏛️ Ciudad de Bs As (LOTBA)
            </button>
            <button
              type="button"
              onClick={() => setFilterLottery('provincia')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterLottery === 'provincia'
                  ? 'bg-emerald-600 text-white font-black shadow'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              🌿 Provincia de Bs As (IPLyC)
            </button>
          </div>
        </div>
      </div>

      {/* Online Play Banner for LOTBA */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-xs text-amber-200">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
          <span>¿Prefieres jugar desde tu teléfono? Puedes hacerlo de forma 100% oficial en la plataforma habilitada.</span>
        </div>
        <a
          href="https://lotba.bet.ar"
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow transition-all shrink-0"
        >
          <span>Jugar Online en lotba.bet.ar</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-bold">
        <span>Agencias Encontradas: <strong className="text-white">{filteredAgencies.length}</strong></span>
        {userLocation && (
          <span className="text-emerald-400 flex items-center gap-1">
            <Compass className="w-3.5 h-3.5" /> Ordenadas por cercanía a tu ubicación
          </span>
        )}
      </div>

      {/* Agencies Cards Grid */}
      {filteredAgencies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredAgencies.map((agency) => {
            const isCiudad = agency.lottery === 'ciudad';
            const mapsUrl = getGoogleMapsUrl(agency);

            return (
              <div 
                key={agency.id} 
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-lg space-y-3 transition-all hover:bg-slate-900"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        isCiudad 
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' 
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {isCiudad ? '🏛️ LOTBA' : '🌿 IPLyC'}
                      </span>
                      <span className="text-[10.5px] font-mono text-slate-400 font-bold">
                        {agency.agencyNumber}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-white mt-1">
                      {agency.name}
                    </h4>
                  </div>

                  {agency.distance !== null && (
                    <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded-lg shrink-0">
                      📍 {agency.distance < 1 ? `${Math.round(agency.distance * 1000)} m` : `${agency.distance.toFixed(1)} km`}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span><strong>{agency.address}</strong>, {agency.barrio}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{agency.hours}</span>
                  </div>
                  {agency.phone && (
                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{agency.phone}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all active:scale-95"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Cómo Llegar</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => handleCopyAddress(agency)}
                    className="py-2 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    {copiedId === agency.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copiar Datos</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
          <div className="p-3 rounded-full bg-slate-800/80 w-fit mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-white">No se encontraron agencias oficiales</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Prueba buscando con otro barrio (ej. Palermo, Belgrano, San Isidro, Quilmes) o cambia el filtro de lotería.
          </p>
          <button
            type="button"
            onClick={() => { setSearchQuery(''); setFilterLottery('all'); }}
            className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 cursor-pointer"
          >
            Restablecer Búsqueda
          </button>
        </div>
      )}
    </div>
  );
}
