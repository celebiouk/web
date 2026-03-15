'use client';

import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isValidUsername } from '@/lib/utils';
import { useDebouncedValue } from './use-debounce';

interface UseUsernameValidationReturn {
  isValid: boolean;
  isAvailable: boolean | null;
  isChecking: boolean;
  error: string | null;
}

/**
 * Hook for validating and checking username availability
 * Debounces API calls to prevent excessive requests
 * 
 * @example
 * const [username, setUsername] = useState('');
 * const validation = useUsernameValidation(username);
 * 
 * <Input
 *   value={username}
 *   onChange={(e) => setUsername(e.target.value)}
 *   error={validation.error}
 * />
 */
export function useUsernameValidation(
  username: string,
  excludeUserId?: string
): UseUsernameValidationReturn {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const debouncedUsername = useDebouncedValue(username, 500);
  const supabase = createClient();

  // First validate format
  const { isValid, error: formatError } = isValidUsername(debouncedUsername);

  // Then check availability if format is valid
  const checkAvailability = useCallback(async () => {
    if (!debouncedUsername || !isValid) {
      setIsAvailable(null);
      return;
    }

    setIsChecking(true);
    
    try {
      let query = supabase
        .from('profiles')
        .select('id')
        .eq('username', debouncedUsername.toLowerCase());

      // Exclude current user when editing their own profile
      if (excludeUserId) {
        query = query.neq('id', excludeUserId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Username check error:', error);
        setIsAvailable(null);
      } else {
        setIsAvailable(data === null);
      }
    } catch {
      setIsAvailable(null);
    } finally {
      setIsChecking(false);
    }
  }, [debouncedUsername, isValid, excludeUserId, supabase]);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  // Determine the error message
  let error: string | null = formatError;
  if (!error && isValid && isAvailable === false) {
    error = 'This username is already taken';
  }

  return {
    isValid: isValid && isAvailable === true,
    isAvailable,
    isChecking,
    error,
  };
}
