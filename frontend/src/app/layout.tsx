'use client'

import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { MainNavbar, SpritesProvider } from '@/components'
import './globals.css'

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin'],
})

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin'],
})

export default function RootLayout({ children }: LayoutProps<'/'>) {
	return (
		<html
			lang='en'
			className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
		>
			<body className='flex min-h-full flex-col'>
				<SpritesProvider>
					<MainNavbar />
					<div>{children}</div>
				</SpritesProvider>
				<Toaster position='bottom-right' />
			</body>
		</html>
	)
}
