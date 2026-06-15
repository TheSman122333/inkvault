'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotesRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/vault'); }, [router]);
  return null;
}
