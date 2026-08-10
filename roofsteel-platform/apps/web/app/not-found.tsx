import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container" style={{ padding: "64px 16px", textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ fontSize: 48, color: "var(--steel)", marginBottom: 8 }}>404</h1>
      <p style={{ fontSize: 18, color: "var(--slate)", marginBottom: 24 }}>
        This page could not be found.
      </p>
      <p style={{ fontSize: 14, color: "var(--steel)", marginBottom: 32 }}>
        The page you're looking for may have been moved or the URL may be incorrect.
      </p>
      <Link href="/" className="btn btn-primary">
        Back to Home
      </Link>
    </div>
  );
}
