import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Loader2 } from "lucide-react";

export const metadata = { title: "Регистрация — Trojan Fall" };

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <AuthForm mode="signup" />
    </Suspense>
  );
}

function AuthFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <Loader2 className="w-6 h-6 text-war-gold animate-spin" />
    </div>
  );
}
