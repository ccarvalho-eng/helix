import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { AuthRedirect } from '../../shared/components/AuthRedirect';

interface AuthRouterProps {
  mode?: 'login' | 'register';
}

export function AuthRouter({ mode }: AuthRouterProps) {
  // Determine mode from URL if not provided
  const currentMode = mode || (window.location.pathname === '/register' ? 'register' : 'login');

  const renderAuthPage = () => {
    switch (currentMode) {
      case 'register':
        return <RegisterPage />;
      case 'login':
      default:
        return <LoginPage />;
    }
  };

  return <AuthRedirect>{renderAuthPage()}</AuthRedirect>;
}
