import React from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Dashboard from '../../app/dashboard/page'
import Sidebar from '@/components/layout/Sidebar';
import Header from '../Header/Page';

const HomePage = () => {
  return (
    <div>
      <Header/>
      <ConnectButton />
  
      <Dashboard/>
    </div>
    
  )
}

export default HomePage