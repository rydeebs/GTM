import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/Navbar'
import { Toaster } from '@/components/ui/toaster'
import { Bebas_Neue, Ubuntu_Condensed } from 'next/font/google'

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-heading',
})

const ubuntuCondensed = Ubuntu_Condensed({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-code',
})

export const metadata: Metadata = {
  title:       'RunGTM — GTM Automation Flows',
  description: 'Discover, share, and fork the best GTM automation flows built with Zapier, Clay, Make, and more.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${ubuntuCondensed.variable}`}>
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
