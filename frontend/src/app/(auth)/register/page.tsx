import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata = {
  title: 'Register | BC Flame Premium',
  description: 'Create your BC Flame Premium Partner account',
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <RegisterForm />
    </div>
  );
}
