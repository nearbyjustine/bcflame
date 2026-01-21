import Image from 'next/image';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <Image src="/logo.svg" alt="BC Flame" width={400} height={200} className="h-48 w-auto" />
        </div>
        <p className="text-muted-foreground">Premium Partner Portal</p>
      </div>
      <LoginForm />
    </div>
  );
}
