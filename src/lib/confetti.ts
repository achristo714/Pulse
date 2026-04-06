// Lightweight confetti burst — no dependencies
export function triggerConfetti() {
  const colors = ['#7C3AED', '#818CF8', '#34D399', '#F472B6', '#FB923C', '#F59E0B'];
  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden';
  document.body.appendChild(container);

  for (let i = 0; i < 40; i++) {
    const dot = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const x = 40 + Math.random() * 20; // center-ish horizontally
    const size = 4 + Math.random() * 6;
    dot.style.cssText = `
      position:absolute;
      left:${x}%;
      top:60%;
      width:${size}px;
      height:${size}px;
      background:${color};
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      opacity:1;
      transition:all ${0.6 + Math.random() * 0.8}s cubic-bezier(0.25,0.46,0.45,0.94);
    `;
    container.appendChild(dot);

    requestAnimationFrame(() => {
      dot.style.left = `${x + (Math.random() - 0.5) * 40}%`;
      dot.style.top = `${10 + Math.random() * 30}%`;
      dot.style.opacity = '0';
      dot.style.transform = `rotate(${Math.random() * 360}deg) scale(0.5)`;
    });
  }

  setTimeout(() => container.remove(), 1800);
}
