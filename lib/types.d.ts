import { ValueType } from 'style-value-types';
import { Action, ValueReaction, ColdSubscription } from 'popmotion';
import { Poser, PoserConfig } from 'pose-core';
import { Pose, PoseMap, PoserState, ExtendAPI, TransformPose, ReadValueFromSource } from 'pose-core';
import { Styler } from 'stylefire';
export declare type Value = {
    raw: ValueReaction;
    type?: ValueType;
};
export declare type Pose = Pose<Action>;
export declare type PoseMap = PoseMap<Action>;
export declare type PoserState = PoserState<Value, Action, ColdSubscription, DomPopmotionPoser>;
export declare type Transformer = (v: any) => any;
export declare type TransitionProps = {
    from: string | number;
    velocity: number;
    to: string | number;
    key: string;
    prevPoseKey: string;
    dimensions: Dimensions;
};
export declare type ResolverProps = TransitionProps & {
    [key: string]: any;
};
export declare type Transition = (props: ResolverProps) => Action | false;
export interface DomPopmotionPoser extends Poser<Value, Action, ColdSubscription, DomPopmotionPoser> {
    addChild: (element: Element, config: PoserConfig<Value>) => DomPopmotionPoser;
    flip: (op: Function) => Promise<any>;
    measure: () => BoundingBox;
}
export declare type DragBounds = {
    [key in BoundingBoxDimension]?: number | string;
};
export declare type DomPopmotionConfig = {
    onDragStart?: (e: MouseEvent | TouchEvent) => any;
    onDragEnd?: (e: MouseEvent | TouchEvent) => any;
    onPressStart?: (e: MouseEvent | TouchEvent) => any;
    onPressEnd?: (e: MouseEvent | TouchEvent) => any;
    draggable?: Draggable;
    hoverable?: boolean;
    dragBounds?: DragBounds | ((props: ResolverProps) => DragBounds);
    props?: {
        [key: string]: any;
    };
    [key: string]: any;
};
export declare type Draggable = boolean | 'x' | 'y';
export declare type PopmotionPoserFactoryConfig<P> = {
    extendAPI: ExtendAPI<Value, Action, ColdSubscription, P>;
    transformPose: TransformPose<Value, Action, ColdSubscription, P>;
    addListenerToValue: (key: string, styler: Styler) => (v: any) => void;
    readValueFromSource?: ReadValueFromSource;
    posePriority?: string[];
    setValueNative: (key: string, to: any, props: {
        elementStyler: Styler;
    }) => void;
};
export declare type Dimensions = {
    get: (measurement?: BoundingBoxDimension) => BoundingBox | number;
    measurementAsPixels: (measurement: BoundingBoxDimension, value: string | number, type?: ValueType) => number;
    measure: () => BoundingBox;
    has: () => boolean;
};
export declare type BoundingBox = {
    [key in BoundingBoxDimension]: number;
};
export declare enum BoundingBoxDimension {
    width = "width",
    height = "height",
    left = "left",
    right = "right",
    top = "top",
    bottom = "bottom"
}
export declare type AnimationDef = {
    type: 'tween' | 'physics' | 'spring' | 'decay' | 'keyframes';
    min?: number;
    max?: number;
    delay?: number;
    round?: boolean;
    [key: string]: any;
};
