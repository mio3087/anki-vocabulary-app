import LanguageWorldMap from "../component/LanguageWorldMap";

export default function LanguageWorldPage() {
  return (
    <main
      className="min-h-screen p-4 md:p-8"
      style={{
        backgroundColor: "var(--background)",
      }}
    >
      <LanguageWorldMap />
    </main>
  );
}