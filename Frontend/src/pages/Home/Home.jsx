import React from 'react';
import Header from '../../components/Header/Header';
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu';
import { useState } from 'react';
import './Home.css';
import FeaturedFoods from '../../components/FeaturedFoods/FeaturedFoods';

// Bewertungen (Testimonials) und Newsletter werden bewusst nicht angezeigt:
// die Bewertungen waren erfunden und der Newsletter versprach Rabatt, ohne etwas zu tun.
// Die Komponenten liegen weiter in pages/Testimonials/ (Bewertungen später aus dem Admin-Panel).
// Der Footer kommt jetzt auf allen Seiten aus App.jsx.
const Home = () => {
  const[category, setCategory]=useState('All');
  return (
    <main className='container'>
      <Header />
      <FeaturedFoods />
      <ExploreMenu category={category} setCategory={setCategory} />
    </main>

  )
}

export default Home;
