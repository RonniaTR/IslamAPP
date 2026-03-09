import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Navigation, MapPin, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

function calculateQibla(lat, lng) {
  const phi1 = (lat * Math.PI) / 180;
  const phi2 = (KAABA_LAT * Math.PI) / 180;
  const dLambda = ((KAABA_LNG - lng) * Math.PI) / 180;
  const y = Math.sin(dLambda);
  const x = Math.cos(phi1) * Math.tan(phi2) - Math.sin(phi1) * Math.cos(dLambda);
  let qibla = (Math.atan2(y, x) * 180) / Math.PI;
  return (qibla + 360) % 360;
}

export default function QiblaPage() {
  const navigate = useNavigate();
  const [heading, setHeading] = useState(0);
  const [qiblaAngle, setQiblaAngle] = useState(null);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [permGranted, setPermGranted] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) { setError('Konum servisi desteklenmiyor'); setLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        setQiblaAngle(calculateQibla(latitude, longitude));
        setLoading(false);
      },
      () => { setError('Konum izni gerekli'); setLoading(false); },
      { enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    const handleOrientation = (e) => {
      let h = e.alpha;
      if (e.webkitCompassHeading) h = e.webkitCompassHeading;
      else if (h !== null) h = 360 - h;
      if (h !== null) { setHeading(h); setPermGranted(true); }
    };

    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS 13+
      const btn = document.getElementById('compass-perm-btn');
      if (btn) btn.addEventListener('click', async () => {
        try {
          const perm = await DeviceOrientationEvent.requestPermission();
          if (perm === 'granted') window.addEventListener('deviceorientation', handleOrientation, true);
        } catch {}
      });
    } else {
      window.addEventListener('deviceorientation', handleOrientation, true);
      setTimeout(() => setPermGranted(true), 1000);
    }
    return () => window.removeEventListener('deviceorientation', handleOrientation, true);
  }, []);

  const rotation = qiblaAngle !== null ? qiblaAngle - heading : 0;

  return (
    <div className="animate-fade-in min-h-screen flex flex-col" data-testid="qibla-page">
      <div className="px-5 pt-10 pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#F5F5DC]">
            <ArrowLeft size={14} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#F5F5DC]" style={{ fontFamily: 'Playfair Display, serif' }}>Kıble Pusulası</h1>
            <p className="text-xs text-[#A8B5A0]">Mekke yönünü bulun</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-10">
        {loading ? (
          <div className="text-center">
            <Loader2 size={32} className="animate-spin text-[#D4AF37] mx-auto mb-3" />
            <p className="text-sm text-[#A8B5A0]">Konum alınıyor...</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <MapPin size={40} className="text-red-400/50 mx-auto mb-3" />
            <p className="text-sm text-red-400">{error}</p>
            <p className="text-xs text-[#A8B5A0] mt-2">Konum iznini açın ve sayfayı yenileyin</p>
          </div>
        ) : (
          <>
            {/* Compass */}
            <div className="relative w-64 h-64 mb-6">
              {/* Outer ring */}
              <div className="absolute inset-0 rounded-full border-2 border-[#D4AF37]/20" />
              <div className="absolute inset-2 rounded-full border border-[#D4AF37]/10" />

              {/* Cardinal directions */}
              <div className="absolute inset-0" style={{ transform: `rotate(${-heading}deg)`, transition: 'transform 0.3s ease-out' }}>
                {['K', 'D', 'G', 'B'].map((d, i) => (
                  <div key={d} className="absolute text-[10px] font-bold"
                    style={{
                      top: i === 0 ? '8px' : i === 2 ? 'auto' : '50%',
                      bottom: i === 2 ? '8px' : 'auto',
                      left: i === 3 ? '8px' : i === 1 ? 'auto' : '50%',
                      right: i === 1 ? '8px' : 'auto',
                      transform: i === 0 || i === 2 ? 'translateX(-50%)' : 'translateY(-50%)',
                      color: i === 0 ? '#ef4444' : '#A8B5A0'
                    }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Qibla needle */}
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.3s ease-out' }}>
                <div className="relative">
                  <div className="w-1.5 h-24 bg-gradient-to-t from-transparent via-[#D4AF37] to-[#D4AF37] rounded-full mx-auto" />
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#D4AF37] rotate-45" />
                </div>
              </div>

              {/* Center Kaaba icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-xl bg-[#0A1F14] border-2 border-[#D4AF37]/30 flex items-center justify-center">
                  <span className="text-lg">🕋</span>
                </div>
              </div>

              {/* Degree indicator */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#D4AF37]/15 border border-[#D4AF37]/30 rounded-full px-3 py-1">
                <p className="text-xs font-bold text-[#D4AF37]">{Math.round(qiblaAngle)}°</p>
              </div>
            </div>

            {!permGranted && (
              <button id="compass-perm-btn" data-testid="compass-perm-btn"
                className="px-4 py-2 rounded-xl text-sm font-medium text-[#0A1F14] mb-4"
                style={{ background: 'linear-gradient(135deg, #D4AF37, #B8860B)' }}>
                Pusula İznini Aç
              </button>
            )}

            <div className="text-center">
              <p className="text-base font-bold text-[#F5F5DC]">Kıble Yönü</p>
              <p className="text-xs text-[#A8B5A0] mt-1">
                {location && `${location.lat.toFixed(4)}° N, ${location.lng.toFixed(4)}° E`}
              </p>
              <p className="text-[10px] text-[#A8B5A0]/60 mt-2 max-w-xs">Telefonunuzu yatay tutun ve altın ok yönüne dönün</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
