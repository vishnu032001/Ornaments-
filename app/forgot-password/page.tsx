import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage(){
  return <section className="mx-auto max-w-md px-6 py-20">
    <h1 className="font-serif text-5xl">Reset password</h1>
    <p className="mt-3 text-stone-500">We will email you a secure reset link.</p>
    <ForgotPasswordForm/>
  </section>;
}
