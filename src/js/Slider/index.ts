import { CanvasTexture, Mesh, PlaneGeometry, ShaderMaterial } from 'three';
import {
  Ctx2DPrerender,
  IOnResize,
  NCallbacks,
  onResize,
} from '@anton.bobrov/vevet-init';
import { createDatGUISettings } from '@anton.bobrov/react-dat-gui';
import { ISlide, IProps } from './types';
import { ProgressHandler } from '../ProgressHandler';

import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';
import noise from './shaders/noise.glsl';

export class Slider {
  private _settings: ReturnType<typeof createDatGUISettings>;

  private _slides: ISlide[];

  private _startSize: { width: number; height: number };

  private _mesh: Mesh;

  private _material: ShaderMaterial;

  private _resizeEvent: IOnResize;

  private _progressHandler: ProgressHandler;

  private _managerEvents: NCallbacks.IAddedCallback[] = [];

  private get aspectRatio() {
    const { container } = this._initialProps;

    return container.clientWidth / container.clientHeight;
  }

  constructor(private _initialProps: IProps) {
    const name = _initialProps.name ?? this.constructor.name;

    const settings = createDatGUISettings({
      name,
      settings: {
        parallax: {
          value: _initialProps.parallax ?? 0.1,
          type: 'number',
          min: 0,
          max: 0.5,
          step: 0.01,
        },
        scale: {
          value: _initialProps.scale ?? 1.2,
          type: 'number',
          min: 1,
          max: 1.5,
          step: 0.01,
        },
        noseOctaves: {
          value: _initialProps.noseOctaves ?? 3,
          type: 'number',
          min: 1,
          max: 8,
          step: 1,
        },
        noiseScale: {
          value: _initialProps.noiseScale ?? 5,
          type: 'number',
          min: 1,
          max: 20,
          step: 1,
        },
      },
      isOpen: true,
      onChange: (data) => {
        this._material.uniforms.u_parallax.value = data.parallax;
        this._material.uniforms.u_scale.value = data.scale;
        this._material.uniforms.u_noiseScale.value = data.noiseScale;

        this._material.defines.NOISE_OCTAVES = data.noseOctaves;
        this._material.needsUpdate = true;
      },
    });
    this._settings = settings;

    const { container, images, scene, manager } = _initialProps;

    // create slides
    this._slides = images.map((image, index) => ({
      index,
      prerender: new Ctx2DPrerender({
        container,
        media: image,
        posRule: 'cover',
        hasResize: false,
        shouldAppend: false,
        dpr: 1,
      }),
    }));

    // save initial size
    this._startSize = {
      width: container.clientWidth,
      height: container.clientHeight,
    };

    // create geometry
    const geometry = new PlaneGeometry(
      this._startSize.width,
      this._startSize.height,
    );

    // create shader material
    this._material = new ShaderMaterial({
      vertexShader,
      fragmentShader: noise + fragmentShader,
      uniforms: {
        u_aspect: { value: this.aspectRatio },
        u_time: { value: 0 },
        u_textures: { value: [] },
        u_progress: { value: 0 },
        u_parallax: { value: settings.settings.parallax },
        u_scale: { value: settings.settings.scale },
        u_noiseScale: { value: settings.settings.noiseScale },
      },
      defines: {
        COUNT: this._slides.length,
        PREV_INDEX: 0,
        NEXT_INDEX: 0,
        NOISE_OCTAVES: settings.settings.noseOctaves,
      },
    });

    // create mesh
    this._mesh = new Mesh(geometry, this._material);
    scene.add(this._mesh);

    // set resize
    this._resizeEvent = onResize({
      element: container,
      viewportTarget: 'any',
      hasBothEvents: true,
      resizeDebounce: 0,
      onResize: () => this._resize(),
    });

    // resize for the first time
    this._resizeEvent.debounceResize();

    // create progress handler
    this._progressHandler = new ProgressHandler({
      container,
      min: 0,
      max: this._slides.length - 1,
      step: 1,
      friction: 0.1,
    });
    this._progressHandler.callbacks.add('render', () => this._render());

    // render
    this._managerEvents.push(
      manager.callbacks.add('render', () => {
        this._material.uniforms.u_time.value += 0.0005;
      }),
    );
  }

  /** Resize the scene */
  private _resize() {
    const { _startSize: startSize, _initialProps: initialProps } = this;

    const { clientWidth, clientHeight } = initialProps.container;
    const widthScale = clientWidth / startSize.width;
    const heightScale = clientHeight / startSize.height;

    // set mesh scale
    this._mesh.scale.set(widthScale, heightScale, 1);

    // update textures
    this._slides.forEach(({ prerender }) => prerender.resize());
    this._material.uniforms.u_textures.value = this._slides.map(
      ({ prerender }) => new CanvasTexture(prerender.canvas),
    );

    // update aspect ratio
    this._material.uniforms.u_aspect.value = this.aspectRatio;
  }

  /** Render the scene */
  private _render() {
    const { minSteppedValue, maxSteppedValue, relativeSteppedProgress } =
      this._progressHandler;

    this._material.defines.PREV_INDEX = minSteppedValue;
    this._material.defines.NEXT_INDEX = maxSteppedValue;
    this._material.needsUpdate = true;

    this._material.uniforms.u_progress.value = relativeSteppedProgress;
  }

  /** Destroy the scene */
  destroy() {
    this._initialProps.scene.remove(this._mesh);

    this._resizeEvent.remove();
    this._progressHandler.destroy();
  }
}
