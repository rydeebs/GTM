import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Toaster } from '@/components/ui/toaster'
import { Coda, Source_Code_Pro } from 'next/font/google'

const coda = Coda({
  subsets: ['latin'],
  weight: ['400', '800'],
  variable: '--font-coda',
})

const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-code',
})

export const metadata: Metadata = {
  title:       'RunGTM — GTM Automation Flows',
  description: 'Discover, share, and fork the best GTM automation flows built with Zapier, Clay, Make, and more.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${coda.variable} ${sourceCodePro.variable}`}>
      <body className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <Toaster />
      </body>
    </html>
  )
}
