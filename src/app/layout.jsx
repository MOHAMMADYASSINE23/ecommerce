import React from 'react'
import { Navbar, Footer } from '../../components'
import { StateContext } from '../../context/StateContext'
import './globals.css'

export const metadata = {
  title: 'PureTone',
  description: 'Ecommerce store',
}

export default function Layout({ children }) {
  return (
    <html lang="en">
      <body>
        <StateContext>
          <div className='layout'>
            <header>
              <Navbar />
            </header>
            <main className='main-container'>
              {children}
            </main>
            <footer>
              <Footer />
            </footer>
          </div>
        </StateContext>
      </body>
    </html>
  );
}

