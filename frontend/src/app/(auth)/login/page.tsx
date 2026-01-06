import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">BC Flame</h1>
        <p className="text-muted-foreground">Premium Partner Portal</p>
      </div>
      <LoginForm />
    </div>
  );
}
