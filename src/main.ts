import './style.css';
import { renderWelcome } from './ui/welcome';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('No se encontró el punto de entrada de Aldea Viva.');
}

renderWelcome(app);
