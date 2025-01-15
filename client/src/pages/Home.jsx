import React from 'react'
import { Outlet } from 'react-router'
import Navbar from '../components/navbar'

function Home() {
  return (
    <>
    <Navbar/>
    <Outlet/>
    
    </>
  )
}

export default Home