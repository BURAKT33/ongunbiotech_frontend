import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { Technology } from '../components/Technology';
import { Features } from '../components/Features';
import { Contact } from '../components/Contact';
import { Footer } from '../components/Footer';

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Technology />
        <Features />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}
