import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <main className="flex flex-col items-center gap-8">
        <h1 className="text-4xl font-bold text-center">
          Welcome to Nexus ReportHub
        </h1>
        <p className="text-xl text-muted-foreground text-center max-w-2xl">
          Comprehensive church financial and inventory management system for
          Rhapsody of Reality distribution
        </p>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            Register
          </Link>
        </div>
      </main>
    </div>
  );
}
