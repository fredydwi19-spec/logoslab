/**
 * Logos LAB - Main JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeaderScroll();
  initCarousel();
  initRevealAnimations();
  initCounters();
});

/* --- Header Scroll Effect --- */
function initHeaderScroll() {
  const header = document.getElementById('header');
  
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

/* --- Games Carousel Logic --- */
function initCarousel() {
  const track = document.getElementById('carousel-track');
  const btnPrev = document.getElementById('carousel-prev');
  const btnNext = document.getElementById('carousel-next');
  
  if (!track || !btnPrev || !btnNext) return;
  
  const scrollAmount = 320; // Width of card + gap
  
  btnNext.addEventListener('click', () => {
    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });
  
  btnPrev.addEventListener('click', () => {
    track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });
}

/* --- Scroll Reveal Animations --- */
function initRevealAnimations() {
  const reveals = document.querySelectorAll('.reveal');
  
  const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    const elementVisible = 100; // Trigger point
    
    reveals.forEach(reveal => {
      const elementTop = reveal.getBoundingClientRect().top;
      if (elementTop < windowHeight - elementVisible) {
        reveal.classList.add('visible');
      }
    });
  };
  
  // Initial check
  revealOnScroll();
  
  // Listen for scroll
  window.addEventListener('scroll', revealOnScroll);
}

/* --- Stats Counters --- */
async function initCounters() {
  const userCountEl = document.getElementById('user-count');
  const visitCountEl = document.getElementById('visit-count');
  
  // 1. Handle Visit Count (Dummy / LocalStorage)
  let visits = localStorage.getItem('logoslab_visits');
  if (!visits) {
    visits = 1250; // Base dummy number
  } else {
    visits = parseInt(visits) + 1;
  }
  localStorage.setItem('logoslab_visits', visits);
  
  if (visitCountEl) {
    animateCounter(visitCountEl, 0, parseInt(visits), 2000);
  }
  
  // 2. Fetch User Count from API
  try {
    const response = await fetch('/users');
    if (response.ok) {
      const data = await response.json();
      if (userCountEl && data.count !== undefined) {
        // Base users + actual users to make it look active
        const totalUsers = 500 + data.count; 
        animateCounter(userCountEl, 0, totalUsers, 2000);
      }
    } else {
      // Fallback
      if (userCountEl) userCountEl.innerText = "500+";
    }
  } catch (error) {
    console.error("Failed to fetch user count:", error);
    if (userCountEl) userCountEl.innerText = "500+";
  }
}

/* --- Utility: Animate Counter --- */
function animateCounter(element, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    
    // Ease out cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(easeProgress * (end - start) + start);
    
    element.innerText = current.toLocaleString('id-ID');
    
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      element.innerText = end.toLocaleString('id-ID') + (end >= 500 ? '+' : '');
    }
  };
  
  window.requestAnimationFrame(step);
}
