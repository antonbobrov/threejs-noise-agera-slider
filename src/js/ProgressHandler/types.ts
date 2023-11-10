import { NCallbacks } from '@anton.bobrov/vevet-init';

export interface IChangeableProps {
  ease?: number;
  friction?: number;
}

export interface IProps extends IChangeableProps {
  container: HTMLElement;
  min: number;
  max: number;
  step: number;
  name?: string;
}

export interface ICallbacksTypes extends NCallbacks.ITypes {
  render: undefined;
}

export interface IWithLerp {
  current: number;
  target: number;
}
