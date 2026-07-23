import { cookies } from 'next/headers';

export function getGithubLoginUrl(redirectUri: string) {
  return `https://github.com/login/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=read:user`;
}

export async function getSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get('helix_token')?.value ?? null;
}