import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function AuthCallback() {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const sessionId = new URLSearchParams(hash.replace('#', '?')).get('session_id');

    if (!sessionId) {
      navigate('/login', { replace: true });
      return;
    }

    api.post(`/auth/session?session_id=${sessionId}`)
      .then(({ data }) => {
        // Clear hash fragment
        window.history.replaceState({}, '', window.location.pathname);
        navigate('/', { replace: true, state: { user: data } });
      })
      .catch(() => {
        navigate('/login', { replace: true });
      });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#0c1222] flex items-center justify-center max-w-[430px] mx-auto" data-testid="auth-callback">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Giriş yapılıyor...</p>
      </div>
    </div>
  );
}
