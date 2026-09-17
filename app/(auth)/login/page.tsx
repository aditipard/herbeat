import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export const metadata = { title: "Sign in to HerBeat" };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-64" aria-hidden="true" />}>
      <LoginForm />
    </Suspense>
  );
}
