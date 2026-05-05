"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pl">
      <body className="min-h-screen flex flex-col items-center justify-center bg-white px-6">
        <p className="text-6xl mb-4">🇵🇱</p>
        <h1 className="text-2xl font-bold text-red-700 mb-2">Coś poszło nie tak</h1>
        <p className="text-gray-500 mb-6">Something went wrong.</p>
        <button
          onClick={reset}
          className="bg-red-700 text-white px-5 py-2 rounded-full font-medium"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
