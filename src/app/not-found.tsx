import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-800 text-white">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-2xl mb-8">Page not found</p>
      <Link
        href="/"
        className="bg-gray-900 hover:bg-gray-700 px-6 py-3 rounded-md font-semibold transition-colors"
      >
        Go back home
      </Link>
    </div>
  );
}

