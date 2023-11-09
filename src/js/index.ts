import '../styles/index.scss';
import { Slider } from './Slider';
import { WebglManager } from './webgl/Manager';

const container = document.getElementById('scene') as HTMLElement;

const manager = new WebglManager(container, {});
manager.play();

// SLIDER

const imagesSrc = ['0.jpg', '1.jpg', '2.jpg', '3.jpg'];

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = src;
  });

Promise.all(imagesSrc.map((src) => loadImage(src)))
  .then((images) => {
    // eslint-disable-next-line no-new
    new Slider({
      container,
      images,
      manager,
      scene: manager.scene,
    });
  })
  .catch(() => {});
