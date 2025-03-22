export function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  const icon = document.getElementById('theme-icon');
  const body = document.body;

  const sunIcon = `
    <circle cx="12" cy="12" r="5" fill="currentColor"/>
    <g stroke="currentColor" stroke-width="2">
      <line x1="12" y1="2" x2="12" y2="4"/>
      <line x1="12" y1="20" x2="12" y2="22"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="2" y1="12" x2="4" y2="12"/>
      <line x1="20" y1="12" x2="22" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </g>
  `;

const moonIcon = `
  <path fill="currentColor" d="M21 12.79A9 9 0 0111.21 3 7 7 0 0012 21a9 9 0 009-8.21z"/>
`;

  function updateIcon() {
    const isDark = body.classList.contains('dark-mode');
    icon.innerHTML = isDark ? moonIcon : sunIcon;
  }

  toggleBtn.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    updateIcon();
  });

  // Initial icon
  updateIcon();
}
