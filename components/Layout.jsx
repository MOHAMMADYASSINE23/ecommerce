import React from 'react'
import Head from 'next/head'
import { Navbar, Footer } from './index'

const Layout = ({ children }) => {
  console.log('Layout component is rendering');
  return (
    <div className='layout'>
      <Head>
        <title>Shopprinece</title>
      </Head>
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
  )
}

export default Layout