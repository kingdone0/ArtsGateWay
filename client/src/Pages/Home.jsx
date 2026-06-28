import React, { useEffect } from 'react'
import HomeImage from '../Components/HomeImage'
import NaveBar from '../Components/NaveBar'
import FeaturedArtists from '../Components/FeaturedArtists';
import LatestArtworks from '../Components/LatestArtworks';

const Home = () => {
  const token =localStorage.getItem('artAppToken')
  const user= localStorage.getItem('artAppUser')
  console.log(token)
  return (
    <>
    <NaveBar/>
    <HomeImage/>
   <FeaturedArtists />
   <LatestArtworks/>
    </>
  )
}

export default Home