import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { decodeToken } from '@/lib/utils';

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      router.push('/');
      return;
    }

    const payload = decodeToken(token);
    if (!payload || !payload.user_id) {
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      setIsLoading(false);
      router.push('/');
      return;
    }

    const cachedUser = localStorage.getItem('userInfo');
    if (cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        setUser(parsed);
        setIsLoading(false);
      } catch (e) {
        fetchUser(payload.user_id);
      }
    } else {
      fetchUser(payload.user_id);
    }

    async function fetchUser(userId) {
      try {
        const response = await api.get(`/user/${userId}`);
        localStorage.setItem('userInfo', JSON.stringify(response.data));
        setUser(response.data);
      } catch (err) {
        console.error('Failed to fetch user context', err);
        if (err.response && (err.response.status === 401 || err.response.status === 404)) {
          localStorage.removeItem('token');
          localStorage.removeItem('userInfo');
          router.push('/');
        }
      } finally {
        setIsLoading(false);
      }
    }
  }, [router]);

  return { user, isLoading };
}