import { useSelector } from 'react-redux';
import {
  selectCurrentUser,
  selectIsAuthenticated,
  selectIsInitialized,
  selectAuthLoading,
  selectAuthError,
  selectAccessToken,
} from '../store/slices/authSlice';

/**
 * Hook: useAuth
 * Provides convenient access to auth state from anywhere in the component tree.
 */
const useAuth = () => {
  const user = useSelector(selectCurrentUser);
  const accessToken = useSelector(selectAccessToken);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isInitialized = useSelector(selectIsInitialized);
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  return { user, accessToken, isAuthenticated, isInitialized, isLoading, error };
};

export default useAuth;
export { useAuth };  // named export alias
