import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
      <p className="text-6xl mb-4">🇵🇱</p>
      <h1 className="text-2xl font-bold text-red-700 mb-2">404</h1>
      <p className="text-gray-500 mb-6">Nie znaleziono strony.</p>
      <Link href="/" className="text-red-700 underline font-medium">
        Wróć do strony głównej
      </Link>
    </main>
  );
}
