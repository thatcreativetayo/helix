"use client";

import Image from "next/image";
import React, { Suspense, useEffect, useState } from "react";
import { Stars } from "@/components/Stars";
import { StarBackground } from "@/components/StarBackground";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "@heroui/react";

function AuthCard() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "missing_code") {
      toast("GitHub didn't return a code. Try again.");
    } else if (error === "auth_failed") {
      toast("Something went wrong authenticating with GitHub.");
    }
  }, [searchParams]);

  const handleLogin = () => {
    setLoading(true);
    const redirectUri = process.env.NEXT_PUBLIC_WEB_CALLBACK_URL!;
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID!;
    const loginUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=read:user`;
    window.location.href = loginUrl;
  };

  return (
    <div className="flex flex-col z-50 items-center justify-center">
      <Image
        src="/logo.svg"
        alt="Logo"
        width={1000}
        height={1000}
        className="h-auto mb-8 w-20"
      />
      <h1 className="font-semibold text-4xl text-center text-white/50">
        Share what&apos;s running on <br /> your machine,{" "}
        <span className="text-white">instantly.</span>
      </h1>

      <button
        onClick={handleLogin}
        disabled={loading}
        className="bg-linear-to-b from-white w-full flex items-center gap-2 justify-center p-2.5 my-6 cursor-pointer rounded-xl text-lg font-medium to-[#C9C9C9] disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
      >
        {loading ? (
          <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
        ) : (
          <Image
            src="/github.svg"
            alt="Logo"
            width={1000}
            height={1000}
            className="size-6"
          />
        )}
        {loading ? "Redirecting..." : "Continue with Github"}
      </button>

      <p className="text-white/50 w-xs text-center mx-auto">
        By continuing, you agree to Helix&apos;s{" "}
        <Link href="/terms" className="text-white font-medium">
          Terms
        </Link>{" "}
        &{" "}
        <Link href="/privacy" className="text-white font-medium">
          Privacy Policy.
        </Link>
      </p>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="flex items-center justify-center">
      <span className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  );
}

const AuthPage = () => {
  return (
    <div className="h-screen w-screen relative bg-dark flex flex-col items-center justify-center">
      <div className="bg-white h-7 w-160 rounded-full blur-[200px] absolute -top-12"></div>
      <Stars />
      <StarBackground />
      <Suspense fallback={<LoginFallback />}>
        <AuthCard />
      </Suspense>
    </div>
  );
};

export default AuthPage;