const SVG_NS = 'http://www.w3.org/2000/svg';

const PATHS_PASO = {
  explorar: ['M10 3a7 7 0 1 0 4.9 12l4.55 4.55 1.4-1.4L16.3 13.6A7 7 0 0 0 10 3Zm0 2a5 5 0 1 1 0 10 5 5 0 0 1 0-10Z'],
  sintetizar: [
    'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z',
    'M12 2 13 5.5 16.5 4.8 16 8.3 19.5 9 17.2 11.6 19.5 14.2 16 15 16.5 18.5 13 17.8 12 21 11 17.8 7.5 18.5 8 15 4.5 14.2 6.8 11.6 4.5 9 8 8.3 7.5 4.8 11 5.5Z',
  ],
  imaginar: [
    'M12 2a6 6 0 0 0-3.6 10.8c.4.3.6.8.6 1.3V15h6v-.9c0-.5.2-1 .6-1.3A6 6 0 0 0 12 2Z',
    'M9 17h6v1.5a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 18.5V17Z',
  ],
  crear: ['M21.7 2.3a1 1 0 0 1 0 1.4l-2.3 2.3-3.4-3.4L18.3 0.3a1 1 0 0 1 1.4 0l2 2ZM14.6 3.9 3.4 15.1 2 22l6.9-1.4L20.1 9.4l-5.5-5.5Z'],
  compartir: [
    'M5 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm14-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 14a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    'M7.5 10.8 16.5 6M7.5 13.2l9 4.8',
  ],
};

export function crearIconoPaso(paso) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');

  const rutas = PATHS_PASO[paso] || [];
  rutas.forEach((d) => {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', '#fff');
    path.setAttribute('stroke-width', '1.3');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('fill', '#fff');
    path.setAttribute('fill-opacity', '0.15');
    svg.appendChild(path);
  });

  return svg;
}
