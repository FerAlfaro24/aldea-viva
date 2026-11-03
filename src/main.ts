import './style.css';
import { mountApp } from './app/mount';
import './ui/game.css';
import { mountCaravan } from './caravan/mount';
import './caravan/caravan.css';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('No se encontró el punto de entrada de Aldea Viva.');
}

const dispose = new URLSearchParams(window.location.search).get('modo') === 'aldea' ? mountApp(app) : mountCaravan(app);
import.meta.hot?.dispose(dispose);
