import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";
import { Loader2 } from "lucide-react";

export const metadata = { title: "Вход — Trojan Fall" };

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <AuthForm mode="login" />
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
