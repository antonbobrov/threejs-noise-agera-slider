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
import { ICallbacksTypes, IProps, IWithLerp } from './types';

export class ProgressHandler {
  private _props: Required<IProps>;

  private get props() {
    return this._props;
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
    return this.props.step;
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

  constructor(initialProps: IProps) {
    this._props = {
      ease: 0.1,
      friction: 0.5,
      ...initialProps,
    };

    this._callbacks = new Callbacks();

    this._animationFrame = new AnimationFrame();
    this._animationFrame.addCallback('frame', () =>
      this._handleAnimationFrame(),
    );

    this._dragger = new DraggerMove({ container: this.props.container });
    this._dragger.addCallback('move', (event) => this._handleDrag(event));

    this._listeners.push(
      addEventListener(this.props.container, 'wheel', (event) =>
        this._handleWheel(event),
      ),
    );
  }

  private _handleWheel(event: WheelEvent) {
    const { _progressLerp: progress, props } = this;
    const { min, max, container } = props;

    const wheel = normalizeWheel(event);
    const y = wheel.pixelY / container.clientHeight;

    progress.target = clamp(progress.target + y, [min, max]);

    this._animationFrame.play();
  }

  private _handleDrag({ step }: NDraggerMove.IMoveParameter) {
    const { _progressLerp: progress, props } = this;
    const { min, max, container } = props;

    const x = step.x / container.clientHeight;
    progress.target = clamp(progress.target - x, [min, max]);

    this._animationFrame.play();
  }

  private _handleAnimationFrame() {
    const { _progressLerp: progress, props } = this;
    const { ease, friction, step } = props;
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
    this._callbacks.destroy();
    this._animationFrame.destroy();
    this._dragger.destroy();

    this._listeners.forEach((listener) => listener.remove());
  }
}
