import {
  AnimationFrame,
  Callbacks,
  DraggerMove,
  NDraggerMove,
  clamp,
  lerp,
  normalizeWheel,
} from '@anton.bobrov/vevet-init';
import { IAddEventListener, addEventListener } from 'vevet-dom';
import { createDatGUISettings } from '@anton.bobrov/react-dat-gui';
import { ICallbacksTypes, IProps, IWithLerp, IChangeableProps } from './types';

export class ProgressHandler {
  private _guiSettings: ReturnType<typeof createDatGUISettings>;

  private get settings() {
    return this._guiSettings.settings as Required<IChangeableProps>;
  }

  private _callbacks: Callbacks<ICallbacksTypes>;

  get callbacks() {
    return this._callbacks;
  }

  private _animationFrame: AnimationFrame;

  private _dragger: DraggerMove;

  private _listeners: IAddEventListener[] = [];

  private _progressLerp: IWithLerp = { current: 0, target: 0 };

  get progress() {
    return this._progressLerp.current;
  }

  get step() {
    return this._initialProps.step;
  }

  get minSteppedValue() {
    return Math.floor(this.progress / this.step) * this.step;
  }

  get maxSteppedValue() {
    return Math.ceil(this.progress / this.step) * this.step;
  }

  get relativeSteppedProgress() {
    return (this.progress - this.minSteppedValue) / this.step;
  }

  constructor(private _initialProps: IProps) {
    const name = _initialProps.name ?? this.constructor.name;
    const { container } = _initialProps;

    // create settings
    const settings = createDatGUISettings({
      name,
      settings: {
        ease: {
          value: _initialProps.ease ?? 0.1,
          type: 'number',
          min: 0,
          max: 0.5,
          step: 0.001,
        },
        friction: {
          value: _initialProps.friction ?? 0.5,
          type: 'number',
          min: 0,
          max: 1,
          step: 0.001,
        },
      },
      isOpen: true,
    });
    this._guiSettings = settings;

    // create callbacks
    this._callbacks = new Callbacks();

    // create animation frame
    this._animationFrame = new AnimationFrame();
    this._animationFrame.addCallback('frame', () =>
      this._handleAnimationFrame(),
    );

    // create dragger
    this._dragger = new DraggerMove({ container });
    this._dragger.addCallback('move', (event) => this._handleDrag(event));

    // add wheel event
    this._listeners.push(
      addEventListener(container, 'wheel', (event) => this._handleWheel(event)),
    );
  }

  private _handleWheel(event: WheelEvent) {
    const { _progressLerp: progress } = this;
    const { min, max, container } = this._initialProps;

    const wheel = normalizeWheel(event);
    const y = wheel.pixelY / container.clientHeight;

    progress.target = clamp(progress.target + y, [min, max]);

    this._animationFrame.play();
  }

  private _handleDrag({ step }: NDraggerMove.IMoveParameter) {
    const { _progressLerp: progress } = this;
    const { min, max, container } = this._initialProps;

    const x = step.x / container.clientHeight;
    progress.target = clamp(progress.target - x, [min, max]);

    this._animationFrame.play();
  }

  private _handleAnimationFrame() {
    const { _progressLerp: progress } = this;
    const { step } = this._initialProps;
    const { ease, friction } = this.settings;
    const { easeMultiplier } = this._animationFrame;

    const nearestSteppedProgress = Math.round(progress.target / step) * step;

    progress.target = lerp(
      progress.target,
      nearestSteppedProgress,
      friction * ease * easeMultiplier,
    );

    progress.current = lerp(
      progress.current,
      progress.target,
      ease * easeMultiplier,
    );

    if (progress.current === progress.target && progress.current % step === 0) {
      this._animationFrame.pause();
    }

    this._render();
  }

  private _render() {
    this._callbacks.tbt('render', undefined);
  }

  public destroy() {
    this._guiSettings.destroy();

    this._callbacks.destroy();
    this._animationFrame.destroy();
    this._dragger.destroy();

    this._listeners.forEach((listener) => listener.remove());
  }
}
