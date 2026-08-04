/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // jsPDF/html2canvas are browser-only (used inside onClick handlers to
  // export charts to PDF). Without this, Next tries to include them in the
  // server-side render bundle for the "use client" components that import
  // them, and jsPDF's Node build pulls in fflate's node.cjs which uses
  // child_process APIs the Vercel build can't resolve - breaks the build
  // with a "Client Component SSR" module-not-found error. Marking them
  // external keeps them out of the server bundle entirely; they're only
  // ever loaded in the browser via the dynamic import() in sessions-chart.tsx.
  serverExternalPackages: ["jspdf", "html2canvas"],
}

export default nextConfig
