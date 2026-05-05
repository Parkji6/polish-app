export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-white px-6 py-12">
      <div className="max-w-sm w-full text-center space-y-6">
        {/* Polish flag colours: white & red */}
        <div className="text-6xl">🇵🇱</div>

        <h1 className="text-3xl font-bold text-red-700 tracking-tight">
          Dzień dobry!
        </h1>

        <p className="text-xl text-gray-700 font-medium">
          Polish learning app
        </p>

        <div className="inline-block bg-red-100 text-red-800 text-sm font-semibold px-4 py-2 rounded-full">
          Day 1
        </div>

        <p className="text-gray-500 text-sm leading-relaxed">
          Building day by day.{" "}
          <span className="font-medium text-gray-700">Dzień po dniu.</span>
        </p>
      </div>
    </main>
  );
}
