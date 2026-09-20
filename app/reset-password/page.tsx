import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export default async function ResetPasswordPage({searchParams}:{searchParams:Promise<{token?:string}>}){
  const {token}=await searchParams;
  return <section className="mx-auto max-w-md px-6 py-20">
    <h1 className="font-serif text-5xl">Choose a new password</h1>
    <ResetPasswordForm token={token??""}/>
  </section>;
}
