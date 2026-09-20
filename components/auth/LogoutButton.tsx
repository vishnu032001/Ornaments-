"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function LogoutButton(){const router=useRouter();const[loading,setLoading]=useState(false);return <button disabled={loading} onClick={async()=>{setLoading(true);await fetch("/api/auth/logout",{method:"POST"});router.push("/");router.refresh()}} className="rounded-full border px-5 py-2">{loading?"Signing out…":"Sign out"}</button>}