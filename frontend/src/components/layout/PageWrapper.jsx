export default function PageWrapper({ children, className = '' }) {
  return (
    <main className={`max-w-6xl mx-auto px-6 py-10 ${className}`}>
      {children}
    </main>
  )
}
