import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';
import { decodeToken } from '@/lib/utils';

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const mutateUser = (newData) => {
    localStorage.setItem('userInfo', JSON.stringify(newData));
    setUser(newData);
  };

  const isProfileComplete = (userData) => {
    return (
      userData &&
      userData.age !== null &&
      userData.age !== undefined &&
      userData.income !== null &&
      userData.income !== undefined &&
      userData.occupation !== null &&
      userData.occupation !== undefined &&
      userData.occupation !== ''
    );
  };

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
        
        // Guard check for cached user
        const complete = isProfileComplete(parsed);
        if (!complete && pathname !== '/onboarding') {
          router.push('/onboarding');
        } else if (complete && pathname === '/onboarding') {
          router.push('/dashboard');
        }
      } catch (e) {
        fetchUser(payload.user_id);
      }
    } else {
      fetchUser(payload.user_id);
    }

    async function fetchUser(userId) {
      try {
        const response = await api.get(`/user/${userId}`);
        const userData = response.data;
        localStorage.setItem('userInfo', JSON.stringify(userData));
        setUser(userData);
        
        // Guard check for fetched user
        const complete = isProfileComplete(userData);
        if (!complete && pathname !== '/onboarding') {
          router.push('/onboarding');
        } else if (complete && pathname === '/onboarding') {
          router.push('/dashboard');
        }
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
  }, [router, pathname]);

  return { user, isLoading, mutateUser };
}