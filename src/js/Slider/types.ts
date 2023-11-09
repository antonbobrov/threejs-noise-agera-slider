import { Ctx2DPrerender } from '@anton.bobrov/vevet-init';
import { Object3D } from 'three';
import { WebglManager } from '../webgl/Manager';

export interface IChangeableProps {
  parallax: number;
  scale: number;
  noseOctaves: number;
  noiseScale: number;
}

export interface IProps extends Partial<IChangeableProps> {
  container: HTMLElement;
  images: HTMLImageElement[];
  manager: WebglManager;
  scene: Object3D;
  name?: string;
}

export interface ISlide {
  index: number;
  prerender: Ctx2DPrerender;
}
