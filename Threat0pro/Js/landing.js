document.addEventListener('DOMContentLoaded', () => {
    // 1. Navbar Scroll Effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 2. INTERACTIVE CYBER CORE (Parallax)
    const heroSection = document.querySelector('.hero');
    const coreContainer = document.querySelector('.cyber-core-container');

    if (heroSection && coreContainer) {
        heroSection.addEventListener('mousemove', (e) => {
            const xAxis = (window.innerWidth / 2 - e.pageX) / 25;
            const yAxis = (window.innerHeight / 2 - e.pageY) / 25;
            coreContainer.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
        });

        heroSection.addEventListener('mouseleave', () => {
            coreContainer.style.transform = `rotateY(0deg) rotateX(0deg)`;
        });
    }

    // 3. Scroll Animations (Fade Ins)
    const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right');
    animatedElements.forEach(el => observer.observe(el));
});

// ... (Keep previous JS) ...

// 5. Testimonials Slider Logic
let currentSlideIndex = 0;
const slides = document.querySelectorAll('.slide');

function showSlide(n) {
    // Reset all slides
    slides.forEach(slide => slide.classList.remove('active'));
    
    // Handle index bounds (Looping)
    currentSlideIndex += n;
    if (currentSlideIndex >= slides.length) {
        currentSlideIndex = 0;
    } else if (currentSlideIndex < 0) {
        currentSlideIndex = slides.length - 1;
    }

    // Show new slide
    slides[currentSlideIndex].classList.add('active');
}

// Expose to window so HTML onclick works
window.moveSlider = function(n) {
    showSlide(n);
};

  const splash = document.getElementById("splash");
  const main = document.getElementById("main-content");
  const video = document.getElementById("splashVideo");

  function showMain() {
    splash.classList.add("fade-out");
    main.classList.add("show");

    // Remove splash from DOM after fade completes
    setTimeout(() => {
      splash.style.display = "none";
    }, 800);
  }

  video.addEventListener("ended", showMain);

  // Safety fallback (in case video fails)
  setTimeout(showMain, 5000);

  const track = document.querySelector('.slider-track');
  const cards = document.querySelectorAll('.glass-slider-card');
  const nextBtn = document.querySelector('.next-btn');
  const prevBtn = document.querySelector('.prev-btn');
  
  let index = 0;
  
  nextBtn.addEventListener('click', () => {
      if (index < cards.length - 3) { // Show 3 cards at a time
          index++;
          updateSlider();
      }
  });
  
  prevBtn.addEventListener('click', () => {
      if (index > 0) {
          index--;
          updateSlider();
      }
  });
  
  function updateSlider() {
      const cardWidth = cards[0].offsetWidth + 30; // width + gap
      track.style.transform = `translateX(-${index * cardWidth}px)`;
  }