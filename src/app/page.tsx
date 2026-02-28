"use client";

import { motion, useScroll, useTransform, Easing } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';

// Custom Easing (Luxury Ease)
const luxuryEase: Easing = [0.22, 1, 0.36, 1];

// Animation Variants
const getStaggerContainer = (delay: number) => ({
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: delay,
    }
  }
});

const fadeUp = {
  hidden: { y: 20, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.8, ease: luxuryEase }
  }
};

const headingLine = {
  hidden: { y: 60, opacity: 0, filter: "blur(8px)" },
  show: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 1.0, ease: luxuryEase }
  }
};

const getNavReveal = (delay: number) => ({
  hidden: { y: -20, opacity: 0, filter: "blur(4px)" },
  show: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: luxuryEase, delay }
  }
});

// Interface for particle initial states
interface ParticleState {
  id: number;
  startX: string;
  endX: string;
  scale: number;
  duration: number;
  delay: number;
}

export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });

  // Parallax for right visual
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, 100]); // Moves 100px down slightly as we scroll down

  // State for particles and synchronized loading
  const [particles, setParticles] = useState<ParticleState[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [animDelay, setAnimDelay] = useState(0.6);

  useEffect(() => {
    // Synchronize Animation with PageLoader
    const hasRun = sessionStorage.getItem('dextra_loader_run');
    if (!hasRun) {
      setTimeout(() => setAnimDelay(3.0), 0); // Wait for the 3s loader
    } else {
      setTimeout(() => setAnimDelay(0.1), 0); // Instant load next time
    }
    setTimeout(() => setIsReady(true), 0);

    // Generate particles only on the client
    const generatedParticles = Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      startX: `${Math.random() * 100}%`,
      endX: `${(Math.random() * 100 - 50) + 50}%`,
      scale: Math.random() * 0.5 + 0.5,
      duration: Math.random() * 10 + 15,
      delay: Math.random() * 10
    }));
    // eslint-disable-next-line
    setParticles(generatedParticles);
  }, []);

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden">
      {/* Navbar */}
      <motion.header
        variants={getNavReveal(animDelay)}
        initial="hidden"
        animate={isReady ? "show" : "hidden"}
        className="fixed top-0 z-50 w-full flex items-center justify-between whitespace-nowrap border-b border-white/10 bg-[#121212]/90 backdrop-blur-md px-6 py-4 md:px-10"
      >
        <div className="flex items-center gap-4 text-white">
          <h2 className="text-white text-xl font-bold leading-tight tracking-[-0.015em] font-display">DEXTRA 2026</h2>
        </div>
        <div className="hidden md:flex flex-1 justify-end gap-8 items-center">
          <nav className="flex items-center gap-8">
            {['Home', 'Events', 'Gallery', 'Contact'].map((item) => (
              <a key={item} className="group relative text-white/80 transition-colors text-sm font-medium leading-normal hover:text-white" href="#">
                {item}
                <span className="absolute -bottom-1 left-1/2 w-0 h-px bg-accent-gold transition-all duration-300 group-hover:w-full group-hover:left-0"></span>
              </a>
            ))}
          </nav>
          <Link href="/register" className="group relative flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-none border border-accent-gold h-10 px-6 bg-transparent text-accent-gold hover:text-[#121212] transition-all duration-500 text-sm font-bold leading-normal tracking-[0.015em] hover:-translate-y-[2px] hover:shadow-[0_0_15px_rgba(198,166,100,0.3)]">
            <span className="absolute inset-0 bg-accent-gold -translate-x-full transition-transform duration-500 ease-in-out group-hover:translate-x-0"></span>
            <span className="relative z-10 truncate transition-colors duration-300">Register Now</span>
          </Link>
        </div>
        {/* Mobile Menu Icon */}
        <button className="md:hidden text-white">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col pt-[73px]">
        {/* Hero Section: 50/50 Split */}
        <section ref={heroRef} className="flex flex-col lg:flex-row min-h-[calc(100vh-73px)] relative">

          {/* Subtle Floating Particles Layer inside Hero */}
          <div className="absolute inset-x-0 bottom-0 h-full pointer-events-none z-[5] overflow-hidden mix-blend-screen">
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute w-1 h-1 rounded-full bg-accent-gold/40 shadow-[0_0_10px_rgba(198,166,100,0.8)]"
                initial={{
                  y: "110%",
                  x: particle.startX,
                  opacity: 0,
                  scale: particle.scale
                }}
                animate={isReady ? {
                  y: "-10%",
                  opacity: [0, 0.8, 0],
                  x: particle.endX
                } : {}}
                transition={{
                  duration: particle.duration,
                  repeat: Infinity,
                  ease: "linear",
                  delay: animDelay + particle.delay
                }}
              />
            ))}
          </div>

          {/* Left Content: Deep Charcoal */}
          <div className="w-full lg:w-1/2 bg-[#121212] flex flex-col justify-center px-6 py-12 md:px-16 lg:px-24 xl:px-32 relative z-10 order-2 lg:order-1">
            <motion.div
              className="max-w-xl"
              variants={getStaggerContainer(animDelay)}
              initial="hidden"
              animate={isReady ? "show" : "hidden"}
            >
              <motion.span
                variants={fadeUp}
                className="inline-block text-accent-gold font-sans font-bold tracking-[0.2em] text-xs uppercase mb-6"
              >
                DEXTRA Arts Fest
              </motion.span>

              <h1 className="text-white font-display text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.1] mb-6 flex flex-col">
                <motion.span variants={headingLine} className="block overflow-hidden pb-2">Different Paths.</motion.span>
                <motion.span variants={headingLine} className="block overflow-hidden relative w-fit">
                  {/* Shimmer implementation */}
                  <motion.span
                    className="italic relative z-10 text-transparent bg-clip-text pb-2"
                    style={{
                      backgroundImage: "linear-gradient(to right, #C6A664 0%, #FFF 50%, #C6A664 100%)",
                      backgroundSize: "200% auto"
                    }}
                    animate={{
                      backgroundPosition: ["200% center", "-200% center"],
                      opacity: [0.95, 1, 0.95]
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  >
                    One
                  </motion.span>
                </motion.span>
                <motion.span variants={headingLine} className="block overflow-hidden">Celebration.</motion.span>
              </h1>

              <motion.p
                variants={fadeUp}
                className="text-white/70 text-lg md:text-xl font-sans font-light mb-10 max-w-md border-l-2 border-accent-gold/30 pl-4 relative"
              >
                <motion.span
                  className="absolute left-[-2px] top-0 w-[2px] bg-accent-gold origin-top"
                  initial={{ scaleY: 0 }}
                  animate={isReady ? { scaleY: 1 } : { scaleY: 0 }}
                  transition={{ duration: 0.8, delay: animDelay + 0.6, ease: luxuryEase }}
                />
                Tradition unites us. Experience the convergence of diverse artistic expressions.
              </motion.p>

              <div className="flex flex-wrap gap-4">
                <motion.div variants={fadeUp} custom={1}>
                  <Link href="/register" className="group flex min-w-[140px] cursor-pointer items-center justify-center rounded-none border border-accent-gold h-12 px-6 bg-accent-gold text-[#121212] hover:bg-[#a6884d] hover:shadow-[0_0_20px_rgba(198,166,100,0.2)] transition-all duration-300 text-sm font-bold tracking-wider uppercase">
                    <span className="truncate">Register Events</span>
                    <span className="material-symbols-outlined ml-2 text-sm transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
            {/* Decorative elements for left side */}
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
          </div>

          {/* Right Visual: Gradient Red to Gold */}
          <div className="w-full lg:w-1/2 bg-[#A11217] relative overflow-hidden flex items-center justify-center min-h-[400px] lg:min-h-full order-1 lg:order-2">
            <motion.div
              className="absolute inset-0 origin-center"
              initial={{ scale: 1.05, opacity: 0 }}
              animate={isReady ? {
                scale: [1, 1.01, 1], // Breathing loop
                opacity: 1
              } : { scale: 1.05, opacity: 0 }}
              transition={{
                opacity: { duration: 1.5, ease: luxuryEase, delay: animDelay },
                scale: { duration: 8, repeat: Infinity, ease: "easeInOut", delay: animDelay }
              }}
              style={{ y: yParallax }}
            >
              {/* Solid gradient background behind moving image */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#A11217] to-[#C6A664]"></div>
              {/* Texture Overlay */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
              {/* Abstract Shape Container */}
              <div className="relative w-full h-full">
                <div className="absolute inset-0 w-full h-full bg-cover bg-center mix-blend-multiply opacity-80" aria-label="Abstract silhouette of performers merging with red and gold light" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCEFOcZsQa3Hn6DGxn93UyUYB6WMemrReBhY5qCcM2p62VuzDxg_FKI-5W7QPqWpBBDK7POHmzY4xYq0rOnVfGQLASZL12WghSCMzoXX7j8fLU7jNSn21qCCxfyBuXgdDHERo4dfz286DTdNZmH9Vb-WDqK-oLqcwm96MK7_CzbVHFTjjS0mXzCCjxQdKXSrtEpVO6sEHb62vMrt3rf3yb2Mbz2F81r836Zy5KZtbb2VLbh1fd-ZZ_tQuzq0D3ASostoPE55Rlad5KD')" }}>
                </div>
                {/* Gradient Overlay to ensure text readability if needed or to enhance mood */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#A11217]/60 via-transparent to-[#C6A664]/20 mix-blend-overlay"></div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Highlights Section */}
        <section className="px-6 py-20 bg-[#181611] border-t border-white/5 overflow-hidden">
          <div className="container mx-auto max-w-[1200px]">
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.2 }}
              className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12"
            >
              <div className="max-w-2xl">
                <motion.h2
                  variants={{
                    hidden: { x: -60, opacity: 0 },
                    show: { x: 0, opacity: 1, transition: { duration: 0.8, ease: luxuryEase } }
                  }}
                  className="text-white font-display text-4xl md:text-5xl font-bold mb-4 relative inline-block"
                >
                  Festival Highlights
                  {/* Underline grow */}
                  <motion.span
                    variants={{
                      hidden: { width: 0 },
                      show: { width: "100%", transition: { duration: 1, delay: 0.3, ease: luxuryEase } }
                    }}
                    className="absolute -bottom-2 left-0 h-[2px] bg-accent-gold"
                  ></motion.span>
                </motion.h2>
                <motion.p
                  variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1, transition: { duration: 0.8, delay: 0.2, ease: luxuryEase } }
                  }}
                  className="text-white/60 text-lg mt-4"
                >
                  Experience the unity of art and culture through our carefully curated events.
                </motion.p>
              </div>
              <motion.a
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { duration: 0.8, delay: 0.4, ease: luxuryEase } }
                }}
                className="group text-accent-gold font-bold uppercase tracking-wider text-sm hover:text-white transition-colors flex items-center gap-2"
                href="#"
              >
                View All Events
                <span className="material-symbols-outlined text-sm transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">arrow_outward</span>
              </motion.a>
            </motion.div>

            <motion.div
              variants={{
                hidden: { opacity: 0 },
                show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.2 } }
              }}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {[
                { icon: 'theater_comedy', title: 'Onstage Events', desc: 'Showcasing spectacular talents and performances bringing the spotlight to diverse artistic expressions on the main floor.' },
                { icon: 'palette', title: 'Offstage Events', desc: 'Engage with visual arts, immersive galleries, and technical competitions designed for brilliance behind the scenes.' }
              ].map((card, i) => (
                <motion.div
                  key={i}
                  variants={{
                    hidden: { y: 40, opacity: 0, scale: 0.97 },
                    show: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.8, ease: luxuryEase } }
                  }}
                  whileHover="hover"
                  className="group relative bg-[#221d10] border border-white/10 p-8 transition-colors duration-500 overflow-hidden"
                >
                  <motion.div
                    variants={{ hover: { opacity: 1 } }}
                    className="absolute inset-0 bg-gradient-to-br from-accent-gold/5 to-transparent opacity-0 transition-opacity duration-500 pointer-events-none"
                  ></motion.div>

                  <div className="relative z-10 transition-transform duration-500 group-hover:-translate-y-2">
                    <div className="absolute top-0 right-0 p-8 opacity-10 transition-all duration-500 group-hover:opacity-20 group-hover:scale-110">
                      <span className="material-symbols-outlined text-6xl text-accent-gold">{card.icon}</span>
                    </div>

                    <motion.div
                      variants={{ hover: { rotate: 5, scale: 1.1 } }}
                      transition={{ duration: 0.3 }}
                      className="text-accent-gold mb-6 inline-block origin-center"
                    >
                      <span className="material-symbols-outlined text-4xl">{card.icon}</span>
                    </motion.div>

                    <h3 className="text-white font-display text-2xl font-bold mb-3 transition-colors duration-300 group-hover:text-accent-gold">{card.title}</h3>
                    <p className="text-white/60 mb-6 font-light leading-relaxed">{card.desc}</p>
                    <span className="inline-block w-8 h-0.5 bg-white/20 transition-all duration-300 group-hover:bg-accent-gold group-hover:w-16"></span>
                  </div>

                  {/* Border Glow Overlay */}
                  <motion.div
                    variants={{ hover: { opacity: 1 } }}
                    className="absolute inset-0 border border-accent-gold/50 opacity-0 transition-opacity duration-500 pointer-events-none shadow-[inset_0_0_20px_rgba(198,166,100,0.1)]"
                  ></motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-[#0f0e0b] border-t border-white/10 px-6 py-12 md:py-16">
        <div className="container mx-auto max-w-[1200px] flex flex-col items-center">
          <div className="flex items-center gap-2 mb-8 text-white opacity-80">
            <span className="font-display font-bold text-lg tracking-wide">DEXTRA 2026</span>
          </div>
          <div className="flex flex-wrap justify-center gap-8 mb-8 text-sm">
            <a className="text-white/60 hover:text-accent-gold transition-colors" href="#">Privacy Policy</a>
            <a className="text-white/60 hover:text-accent-gold transition-colors" href="#">Terms of Service</a>
            <a className="text-white/60 hover:text-accent-gold transition-colors" href="#">Code of Conduct</a>
          </div>
          <div className="flex gap-6 mb-8">
            <a className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-accent-gold hover:border-accent-gold transition-all" href="#">
              <span className="font-bold">IG</span>
            </a>
            <a className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-accent-gold hover:border-accent-gold transition-all" href="#">
              <span className="font-bold">FB</span>
            </a>
            <a className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-accent-gold hover:border-accent-gold transition-all" href="#">
              <span className="font-bold">X</span>
            </a>
          </div>
          <p className="text-white/40 text-xs font-light tracking-wide">© 2026 DEXTRA Arts Festival. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
