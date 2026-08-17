/**
 * FinAI API İstemcisi
 * Otomatik JWT Access Token ekleme, 401 Unauthorized durumlarında
 * Refresh Token ile otomatik token yenileme (Token Rotation) sağlar.
 */

const API_BASE_URL = 'http://localhost:5115';

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function fetchWithAuth(url: string, options: FetchOptions = {}): Promise<Response> {
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
  
  let storedUserRaw = typeof window !== 'undefined' ? localStorage.getItem('finai_user') : null;
  let user = storedUserRaw ? JSON.parse(storedUserRaw) : null;
  let token = user?.accessToken || user?.token;

  const headers: Record<string, string> = {
    ...options.headers,
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(fullUrl, { ...options, headers });

  // Eğer 401 Unauthorized dönerse ve elimizde refresh token varsa token yenilemeyi dene
  if (response.status === 401 && user?.refreshToken) {
    try {
      const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: user.refreshToken }),
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        
        // localStorage günceller
        const updatedUser = {
          ...user,
          token: refreshData.accessToken,
          accessToken: refreshData.accessToken,
          refreshToken: refreshData.refreshToken,
        };
        localStorage.setItem('finai_user', JSON.stringify(updatedUser));

        // Yenilenmiş token ile isteği tekrar et
        headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
        response = await fetch(fullUrl, { ...options, headers });
      } else {
        // Refresh token geçersiz ise oturumu kapat ve yönlendir
        logout();
      }
    } catch (err) {
      console.error('Token yenileme sırasında hata oluştu:', err);
      logout();
    }
  }

  return response;
}

export async function logout(): Promise<void> {
  if (typeof window === 'undefined') return;

  const storedUserRaw = localStorage.getItem('finai_user');
  if (storedUserRaw) {
    try {
      const user = JSON.parse(storedUserRaw);
      if (user.refreshToken) {
        await fetch(`${API_BASE_URL}/api/auth/revoke`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: user.refreshToken }),
        });
      }
    } catch (e) {
      console.error('Logout hatası:', e);
    }
  }

  localStorage.removeItem('finai_user');
  window.location.href = '/login';
}
