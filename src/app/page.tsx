import TypeRace from './components/TypeRace';

export default function Home() {
  return (
    <main className="flex flex-col items-center min-h-screen py-8">
      <h1 className="text-3xl font-bold mb-8 text-teal-400">TypeRace</h1>
      <TypeRace />
    </main>
  );
}
