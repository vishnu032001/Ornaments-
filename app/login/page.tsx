import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <section className="mx-auto max-w-md px-6 py-20">
      <h1 className="font-serif text-5xl">Welcome back</h1>
      <p className="mt-3 text-stone-500">Sign in to view your orders and account.</p>
      <Suspense fallback={<div className="mt-8 h-48 rounded-2xl border border-stone-200" aria-hidden="true" />}>
        <LoginForm />
      </Suspense>
    </section>
  );
}