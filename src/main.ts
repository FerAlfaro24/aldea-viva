import './style.css';
import { mountApp } from './app/mount';
import './ui/game.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('No se encontró el punto de entrada de Aldea Viva.');
}

const dispose = mountApp(app);
import.meta.hot?.dispose(dispose);
