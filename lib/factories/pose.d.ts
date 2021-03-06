import { Action, ColdSubscription } from 'popmotion';
import { Poser } from 'pose-core';
import { Value, PopmotionPoserFactoryConfig } from '../types';
export { Poser };
declare const pose: <P>({ transformPose, addListenerToValue, extendAPI, readValueFromSource, posePriority, setValueNative }: PopmotionPoserFactoryConfig<P>) => (config: import("pose-core/lib/types").PoserConfig<Value>) => Poser<Value, Action, ColdSubscription, P>;
export default pose;
