import { spring, tween, action, pointer, transform, decay, keyframes, physics, value, chain, easing, delay, listen, styler } from 'popmotion';
import { linear } from '@popmotion/easing';
import { percent, number, degrees, px, vw, vh } from 'style-value-types';
import poseFactory from 'pose-core';
import { invariant } from 'hey-listen';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

var __assign = function () {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function") for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0) t[p[i]] = s[p[i]];
    return t;
}

var BoundingBoxDimension;
(function (BoundingBoxDimension) {
    BoundingBoxDimension["width"] = "width";
    BoundingBoxDimension["height"] = "height";
    BoundingBoxDimension["left"] = "left";
    BoundingBoxDimension["right"] = "right";
    BoundingBoxDimension["top"] = "top";
    BoundingBoxDimension["bottom"] = "bottom";
})(BoundingBoxDimension || (BoundingBoxDimension = {}));

var measureWithoutTransform = function (element) {
    var transform$$1 = element.style.transform;
    element.style.transform = '';
    var bbox = element.getBoundingClientRect();
    element.style.transform = transform$$1;
    return bbox;
};
var resolveProp = function (target, props) {
    return typeof target === 'function' ? target(props) : target;
};

var interpolate = transform.interpolate;
var singleAxisPointer = function (axis) {
    return function (from) {
        var _a;
        return pointer((_a = {}, _a[axis] = typeof from === 'string' ? parseFloat(from) : from, _a)).pipe(function (v) {
            return v[axis];
        });
    };
};
var pointerX = /*#__PURE__*/singleAxisPointer('x');
var pointerY = /*#__PURE__*/singleAxisPointer('y');
var createPointer = function (axisPointerCreator, min, max, measurement) {
    return function (transitionProps) {
        var from = transitionProps.from,
            type = transitionProps.type,
            dimensions = transitionProps.dimensions,
            dragBounds = transitionProps.dragBounds;
        var axisPointer = axisPointerCreator(dimensions.measurementAsPixels(measurement, from, type));
        var transformQueue = [];
        if (dragBounds) {
            var resolvedDragBounds_1 = resolveProp(dragBounds, transitionProps);
            if (resolvedDragBounds_1[min] !== undefined) {
                transformQueue.push(function (v) {
                    return Math.max(v, dimensions.measurementAsPixels(measurement, resolvedDragBounds_1[min], type));
                });
            }
            if (resolvedDragBounds_1[max] !== undefined) {
                transformQueue.push(function (v) {
                    return Math.min(v, dimensions.measurementAsPixels(measurement, resolvedDragBounds_1[max], type));
                });
            }
        }
        if (type === percent) {
            transformQueue.push(interpolate([0, dimensions.get(measurement)], [0, 100]), function (v) {
                return v + '%';
            });
        }
        return transformQueue.length ? axisPointer.pipe.apply(axisPointer, transformQueue) : axisPointer;
    };
};
var just = function (from) {
    return action(function (_a) {
        var update = _a.update,
            complete = _a.complete;
        update(from);
        complete();
    });
};
var underDampedSpring = function (_a) {
    var from = _a.from,
        velocity = _a.velocity,
        to = _a.to;
    return spring({
        from: from,
        to: to,
        velocity: velocity,
        stiffness: 500,
        damping: 25,
        restDelta: 0.5,
        restSpeed: 10
    });
};
var overDampedSpring = function (_a) {
    var from = _a.from,
        velocity = _a.velocity,
        to = _a.to;
    return spring({ from: from, to: to, velocity: velocity, stiffness: 700, damping: to === 0 ? 100 : 35 });
};
var linearTween = function (_a) {
    var from = _a.from,
        to = _a.to;
    return tween({ from: from, to: to, ease: linear });
};
var intelligentTransition = {
    x: underDampedSpring,
    y: underDampedSpring,
    z: underDampedSpring,
    rotate: underDampedSpring,
    rotateX: underDampedSpring,
    rotateY: underDampedSpring,
    rotateZ: underDampedSpring,
    scaleX: overDampedSpring,
    scaleY: overDampedSpring,
    scale: overDampedSpring,
    opacity: linearTween,
    default: tween
};
var dragAction = /*#__PURE__*/__assign({}, intelligentTransition, { x: /*#__PURE__*/createPointer(pointerX, 'left', 'right', BoundingBoxDimension.width), y: /*#__PURE__*/createPointer(pointerY, 'top', 'bottom', BoundingBoxDimension.height) });
var justAxis = function (_a) {
    var from = _a.from;
    return just(from);
};
var intelligentDragEnd = /*#__PURE__*/__assign({}, intelligentTransition, { x: justAxis, y: justAxis });
var defaultTransitions = /*#__PURE__*/new Map([['default', intelligentTransition], ['drag', dragAction], ['dragEnd', intelligentDragEnd]]);

var auto = {
    test: function (v) {
        return v === 'auto';
    },
    parse: function (v) {
        return v;
    }
};
var valueTypeTests = [number, degrees, percent, px, vw, vh, auto];
var testValueType = function (v) {
    return function (type) {
        return type.test(v);
    };
};
var getValueType = function (v) {
    return valueTypeTests.find(testValueType(v));
};

var createPassiveValue = function (init, parent, transform$$1) {
    var raw = value(transform$$1(init));
    parent.raw.subscribe(function (v) {
        return raw.update(transform$$1(v));
    });
    return { raw: raw };
};
var createValue = function (init) {
    var type = getValueType(init);
    var raw = value(init);
    return { raw: raw, type: type };
};
var addActionDelay = function (delay$$1, transition) {
    if (delay$$1 === void 0) {
        delay$$1 = 0;
    }
    return chain(delay(delay$$1), transition);
};
var animationLookup = {
    tween: tween,
    spring: spring,
    decay: decay,
    keyframes: keyframes,
    physics: physics
};
var linear$1 = easing.linear,
    easeIn = easing.easeIn,
    easeOut = easing.easeOut,
    easeInOut = easing.easeInOut,
    circIn = easing.circIn,
    circOut = easing.circOut,
    circInOut = easing.circInOut,
    backIn = easing.backIn,
    backOut = easing.backOut,
    backInOut = easing.backInOut,
    anticipate = easing.anticipate;
var easingLookup = {
    linear: linear$1,
    easeIn: easeIn,
    easeOut: easeOut,
    easeInOut: easeInOut,
    circIn: circIn,
    circOut: circOut,
    circInOut: circInOut,
    backIn: backIn,
    backOut: backOut,
    backInOut: backInOut,
    anticipate: anticipate
};
var getAction = function (v, _a, _b) {
    var from = _b.from,
        to = _b.to,
        velocity = _b.velocity;
    var _c = _a.type,
        type = _c === void 0 ? 'tween' : _c,
        ease = _a.ease,
        def = __rest(_a, ["type", "ease"]);
    invariant(animationLookup[type] !== undefined, "Invalid transition type '" + type + "'. Valid transition types are: tween, spring, decay, physics and keyframes.");
    if (type === 'tween') {
        var typeOfEase = typeof ease;
        if (typeOfEase !== 'function') {
            if (typeOfEase === 'string') {
                invariant(easingLookup[ease] !== undefined, "Invalid easing type '" + ease + "'. popmotion.io/pose/api/config");
                ease = easingLookup[ease];
            } else if (Array.isArray(ease)) {
                invariant(ease.length === 4, "Cubic bezier arrays must contain four numerical values.");
                var x1 = ease[0],
                    y1 = ease[1],
                    x2 = ease[2],
                    y2 = ease[3];
                ease = easing.cubicBezier(x1, y1, x2, y2);
            }
        }
    }
    var baseProps = type !== 'keyframes' ? {
        from: from,
        to: to,
        velocity: velocity,
        ease: ease
    } : { ease: ease };
    return animationLookup[type](__assign({}, baseProps, def));
};
var isAction = function (action$$1) {
    return typeof action$$1.start !== 'undefined';
};
var pose = function (_a) {
    var transformPose = _a.transformPose,
        addListenerToValue = _a.addListenerToValue,
        extendAPI = _a.extendAPI,
        readValueFromSource = _a.readValueFromSource,
        posePriority = _a.posePriority,
        setValueNative = _a.setValueNative;
    return poseFactory({
        bindOnChange: function (values, onChange) {
            return function (key) {
                if (!values.has(key)) return;
                var raw = values.get(key).raw;
                raw.subscribe(onChange[key]);
            };
        },
        readValue: function (_a) {
            var raw = _a.raw;
            return raw.get();
        },
        setValue: function (_a, to) {
            var raw = _a.raw;
            return raw.update(to);
        },
        createValue: function (init, key, _a, _b) {
            var elementStyler = _a.elementStyler;
            var _c = _b === void 0 ? {} : _b,
                passiveParent = _c.passiveParent,
                passiveProps = _c.passiveProps;
            var val = passiveParent ? createPassiveValue(init, passiveParent, passiveProps) : createValue(init);
            if (addListenerToValue) {
                val.raw.subscribe(addListenerToValue(key, elementStyler));
            }
            return val;
        },
        convertValue: function (raw, key, _a) {
            var elementStyler = _a.elementStyler;
            if (addListenerToValue) {
                raw.subscribe(addListenerToValue(key, elementStyler));
            }
            return {
                raw: raw,
                type: getValueType(raw.get())
            };
        },
        getTransitionProps: function (_a, to) {
            var raw = _a.raw,
                type = _a.type;
            return {
                from: raw.get(),
                velocity: raw.getVelocity(),
                to: to,
                type: type
            };
        },
        resolveTarget: function (_, to) {
            return to;
        },
        selectValueToRead: function (_a) {
            var raw = _a.raw;
            return raw;
        },
        startAction: function (_a, action$$1, complete) {
            var raw = _a.raw;
            var reaction = {
                update: function (v) {
                    return raw.update(v);
                },
                complete: complete
            };
            return action$$1.start(reaction);
        },
        stopAction: function (action$$1) {
            return action$$1.stop();
        },
        getInstantTransition: function (_, _a) {
            var to = _a.to;
            return just(to);
        },
        convertTransitionDefinition: function (val, def, props) {
            if (isAction(def)) return def;
            var delay$$1 = def.delay,
                min = def.min,
                max = def.max,
                round = def.round,
                remainingDef = __rest(def, ["delay", "min", "max", "round"]);
            var action$$1 = getAction(val, remainingDef, props);
            var outputPipe = [];
            if (delay$$1) action$$1 = addActionDelay(delay$$1, action$$1);
            if (min !== undefined) outputPipe.push(function (v) {
                return Math.max(v, min);
            });
            if (max !== undefined) outputPipe.push(function (v) {
                return Math.min(v, max);
            });
            if (round) outputPipe.push(Math.round);
            return outputPipe.length ? action$$1.pipe.apply(action$$1, outputPipe) : action$$1;
        },
        setValueNative: setValueNative,
        addActionDelay: addActionDelay,
        defaultTransitions: defaultTransitions,
        transformPose: transformPose,
        readValueFromSource: readValueFromSource,
        posePriority: posePriority,
        extendAPI: extendAPI
    });
};

var createDimensions = function (element) {
    var hasMeasured = false;
    var current = {
        width: 0,
        height: 0,
        top: 0,
        left: 0,
        bottom: 0,
        right: 0
    };
    return {
        get: function (measurement) {
            return measurement ? current[measurement] : current;
        },
        measure: function () {
            current = element.getBoundingClientRect();
            hasMeasured = true;
            return current;
        },
        measurementAsPixels: function (measurement, value$$1, type) {
            return type === percent ? (typeof value$$1 === 'string' ? parseFloat(value$$1) : value$$1) / 100 * current[measurement] : value$$1;
        },
        has: function () {
            return hasMeasured;
        }
    };
};

var makeUIEventApplicator = function (_a) {
    var startEvents = _a.startEvents,
        endEvents = _a.endEvents,
        startPose = _a.startPose,
        endPose = _a.endPose,
        startCallback = _a.startCallback,
        endCallback = _a.endCallback,
        useDocumentToEnd = _a.useDocumentToEnd,
        preventDefault = _a.preventDefault;
    return function (element, activeActions, poser, config) {
        var startListener = startPose + 'Start';
        var endListener = startPose + 'End';
        var eventStartListener = listen(element, startEvents).start(function (startEvent) {
            if (preventDefault) startEvent.preventDefault();
            poser.set(startPose);
            if (startCallback && config[startCallback]) config[startCallback](startEvent);
            var eventEndListener = listen(useDocumentToEnd ? document.documentElement : element, endEvents + (useDocumentToEnd ? ' mouseenter' : '')).start(function (endEvent) {
                if (useDocumentToEnd && endEvent.type === 'mouseenter' && endEvent.buttons === 1) {
                    return;
                }
                if (preventDefault) endEvent.preventDefault();
                activeActions.get(endListener).stop();
                poser.unset(startPose);
                poser.set(endPose);
                if (endCallback && config[endCallback]) config[endCallback](endEvent);
            });
            activeActions.set(endListener, eventEndListener);
        });
        activeActions.set(startListener, eventStartListener);
    };
};
var events = {
    draggable: /*#__PURE__*/makeUIEventApplicator({
        startEvents: 'mousedown touchstart',
        endEvents: 'mouseup touchend',
        startPose: 'drag',
        endPose: 'dragEnd',
        startCallback: 'onDragStart',
        endCallback: 'onDragEnd',
        useDocumentToEnd: true,
        preventDefault: true
    }),
    hoverable: /*#__PURE__*/makeUIEventApplicator({
        startEvents: 'mouseenter',
        endEvents: 'mouseleave',
        startPose: 'hover',
        endPose: 'hoverEnd'
    }),
    focusable: /*#__PURE__*/makeUIEventApplicator({
        startEvents: 'focus',
        endEvents: 'blur',
        startPose: 'focus',
        endPose: 'blur'
    }),
    pressable: /*#__PURE__*/makeUIEventApplicator({
        startEvents: 'mousedown touchstart',
        endEvents: 'mouseup touchend',
        startPose: 'press',
        endPose: 'pressEnd',
        startCallback: 'onPressStart',
        endCallback: 'onPressEnd',
        useDocumentToEnd: true
    })
};
var eventKeys = /*#__PURE__*/Object.keys(events);
var appendEventListeners = function (element, activeActions, poser, _a) {
    var props = _a.props;
    return eventKeys.forEach(function (key) {
        if (props[key]) events[key](element, activeActions, poser, props);
    });
};

var ORIGIN_START = 0;
var ORIGIN_CENTER = '50%';
var ORIGIN_END = '100%';
var findCenter = function (_a) {
    var top = _a.top,
        right = _a.right,
        bottom = _a.bottom,
        left = _a.left;
    return {
        x: (left + right) / 2,
        y: (top + bottom) / 2
    };
};
var positionalProps = ['width', 'height', 'top', 'left', 'bottom', 'right'];
var positionalPropsDict = /*#__PURE__*/new Set(positionalProps);
var checkPositionalProp = function (key) {
    return positionalPropsDict.has(key);
};
var hasPositionalProps = function (pose) {
    return Object.keys(pose).some(checkPositionalProp);
};
var isFlipPose = function (flip, key, state) {
    return state.props.element instanceof HTMLElement && (flip === true || key === 'flip');
};
var setValue = function (_a, key, to) {
    var values = _a.values,
        props = _a.props;
    if (values.has(key)) {
        var raw = values.get(key).raw;
        raw.update(to);
        raw.update(to);
    } else {
        values.set(key, {
            raw: value(to, function (v) {
                return props.elementStyler.set(key, v);
            })
        });
    }
};
var explicitlyFlipPose = function (state, nextPose) {
    var _a = state.props,
        dimensions = _a.dimensions,
        elementStyler = _a.elementStyler;
    dimensions.measure();
    var width = nextPose.width,
        height = nextPose.height,
        top = nextPose.top,
        left = nextPose.left,
        bottom = nextPose.bottom,
        right = nextPose.right,
        position = nextPose.position,
        remainingPose = __rest(nextPose, ["width", "height", "top", "left", "bottom", "right", "position"]);
    var propsToSet = positionalProps.concat('position').reduce(function (acc, key) {
        if (nextPose[key] !== undefined) {
            acc[key] = resolveProp(nextPose[key], state.props);
        }
        return acc;
    }, {});
    elementStyler.set(propsToSet).render();
    return implicitlyFlipPose(state, remainingPose);
};
var implicitlyFlipPose = function (state, nextPose) {
    var _a = state.props,
        dimensions = _a.dimensions,
        element = _a.element,
        elementStyler = _a.elementStyler;
    if (!dimensions.has()) return {};
    var prev = dimensions.get();
    var next = measureWithoutTransform(element);
    var originX = prev.left === next.left ? ORIGIN_START : prev.right === next.right ? ORIGIN_END : ORIGIN_CENTER;
    var originY = prev.top === next.top ? ORIGIN_START : prev.bottom === next.bottom ? ORIGIN_END : ORIGIN_CENTER;
    elementStyler.set({ originX: originX, originY: originY });
    var flipPoseProps = {};
    if (prev.width !== next.width) {
        setValue(state, 'scaleX', prev.width / next.width);
        flipPoseProps.scaleX = 1;
    }
    if (prev.height !== next.height) {
        setValue(state, 'scaleY', prev.height / next.height);
        flipPoseProps.scaleY = 1;
    }
    var prevCenter = findCenter(prev);
    var nextCenter = findCenter(next);
    if (originX === ORIGIN_CENTER) {
        setValue(state, 'x', prevCenter.x - nextCenter.x);
        flipPoseProps.x = 0;
    }
    if (originY === ORIGIN_CENTER) {
        setValue(state, 'y', prevCenter.y - nextCenter.y);
        flipPoseProps.y = 0;
    }
    elementStyler.render();
    return __assign({}, nextPose, flipPoseProps);
};
var flipPose = function (props, nextPose) {
    return hasPositionalProps(nextPose) ? explicitlyFlipPose(props, nextPose) : implicitlyFlipPose(props, nextPose);
};

var getPosFromMatrix = function (matrix, pos) {
    return parseFloat(matrix.split(', ')[pos]);
};
var getTranslateFromMatrix = function (pos2, pos3) {
    return function (element, bbox, _a) {
        var transform$$1 = _a.transform;
        if (transform$$1 === 'none') return 0;
        var matrix3d = transform$$1.match(/^matrix3d\((.+)\)$/);
        if (matrix3d) return getPosFromMatrix(matrix3d[1], pos3);
        return getPosFromMatrix(transform$$1.match(/^matrix\((.+)\)$/)[1], pos2);
    };
};
var positionalValues = {
    width: function (element, _a) {
        var width = _a.width;
        return width;
    },
    height: function (element, _a) {
        var height = _a.height;
        return height;
    },
    top: function (element, bbox, _a) {
        var top = _a.top;
        return parseFloat(top);
    },
    left: function (element, bbox, _a) {
        var left = _a.left;
        return parseFloat(left);
    },
    bottom: function (element, _a, _b) {
        var height = _a.height;
        var top = _b.top;
        return parseFloat(top) + height;
    },
    right: function (element, _a, _b) {
        var width = _a.width;
        var left = _b.left;
        return parseFloat(left) + width;
    },
    x: /*#__PURE__*/getTranslateFromMatrix(4, 13),
    y: /*#__PURE__*/getTranslateFromMatrix(5, 14)
};
var isPositionalKey = function (v) {
    return positionalValues[v] !== undefined;
};
var isPositional = function (pose) {
    return Object.keys(pose).some(isPositionalKey);
};
var convertPositionalUnits = function (state, pose) {
    var values = state.values,
        props = state.props;
    var element = props.element,
        elementStyler = props.elementStyler;
    var positionalPoseKeys = Object.keys(pose).filter(isPositionalKey);
    var changedPositionalKeys = [];
    var elementComputedStyle = getComputedStyle(element);
    positionalPoseKeys.forEach(function (key) {
        var value$$1 = values.get(key);
        var fromValueType = getValueType(value$$1.raw.get());
        var to = resolveProp(pose[key], props);
        var toValueType = getValueType(to);
        if (fromValueType !== toValueType) {
            changedPositionalKeys.push(key);
            pose.applyAtEnd = pose.applyAtEnd || {};
            pose.applyAtEnd[key] = pose[key];
            setValue(state, key, to);
        }
    });
    if (!changedPositionalKeys.length) return pose;
    var originBbox = element.getBoundingClientRect();
    var top = elementComputedStyle.top,
        left = elementComputedStyle.left,
        bottom = elementComputedStyle.bottom,
        right = elementComputedStyle.right,
        transform$$1 = elementComputedStyle.transform;
    var originComputedStyle = { top: top, left: left, bottom: bottom, right: right, transform: transform$$1 };
    elementStyler.render();
    var targetBbox = element.getBoundingClientRect();
    var newPose = __assign({}, pose);
    changedPositionalKeys.forEach(function (key) {
        setValue(state, key, positionalValues[key](element, originBbox, originComputedStyle));
        newPose[key] = positionalValues[key](element, targetBbox, elementComputedStyle);
    });
    elementStyler.render();
    return newPose;
};

var dragPoses = function (draggable) {
    var drag = {
        preTransition: function (_a) {
            var dimensions = _a.dimensions;
            return dimensions.measure();
        }
    };
    var dragEnd = {};
    if (draggable === true || draggable === 'x') drag.x = dragEnd.x = 0;
    if (draggable === true || draggable === 'y') drag.y = dragEnd.y = 0;
    return { drag: drag, dragEnd: dragEnd };
};
var createPoseConfig = function (element, _a) {
    var onDragStart = _a.onDragStart,
        onDragEnd = _a.onDragEnd,
        onPressStart = _a.onPressStart,
        onPressEnd = _a.onPressEnd,
        onPoseComplete = _a.onPoseComplete,
        draggable = _a.draggable,
        hoverable = _a.hoverable,
        focusable = _a.focusable,
        pressable = _a.pressable,
        dragBounds = _a.dragBounds,
        config = __rest(_a, ["onDragStart", "onDragEnd", "onPressStart", "onPressEnd", "onPoseComplete", "draggable", "hoverable", "focusable", "pressable", "dragBounds"]);
    var poseConfig = __assign({ flip: {} }, config, { props: __assign({}, config.props, { onDragStart: onDragStart,
            onDragEnd: onDragEnd,
            onPressStart: onPressStart,
            onPressEnd: onPressEnd,
            onPoseComplete: onPoseComplete,
            dragBounds: dragBounds,
            draggable: draggable,
            hoverable: hoverable,
            focusable: focusable,
            pressable: pressable,
            element: element, elementStyler: styler(element, { preparseOutput: false }), dimensions: createDimensions(element) }) });
    if (draggable) {
        var _b = dragPoses(draggable),
            drag = _b.drag,
            dragEnd = _b.dragEnd;
        poseConfig.drag = __assign({}, poseConfig.drag, drag);
        poseConfig.dragEnd = __assign({}, poseConfig.dragEnd, dragEnd);
    }
    return poseConfig;
};
var domPose = /*#__PURE__*/pose({
    posePriority: ['drag', 'press', 'focus', 'hover'],
    transformPose: function (_a, name, state) {
        var flip = _a.flip,
            pose$$1 = __rest(_a, ["flip"]);
        if (isFlipPose(flip, name, state)) {
            return flipPose(state, pose$$1);
        } else if (isPositional(pose$$1)) {
            return convertPositionalUnits(state, pose$$1);
        }
        return pose$$1;
    },
    addListenerToValue: function (key, elementStyler) {
        return function (v) {
            return elementStyler.set(key, v);
        };
    },
    readValueFromSource: function (key, _a) {
        var elementStyler = _a.elementStyler,
            dragBounds = _a.dragBounds;
        var value$$1 = elementStyler.get(key);
        if (dragBounds && (key === 'x' || key === 'y')) {
            var bound = key === 'x' ? dragBounds.left || dragBounds.right : dragBounds.top || dragBounds.bottom;
            if (bound) {
                var boundType = getValueType(bound);
                value$$1 = boundType.transform(value$$1);
            }
        }
        return isNaN(value$$1) ? value$$1 : parseFloat(value$$1);
    },
    setValueNative: function (key, to, _a) {
        var elementStyler = _a.elementStyler;
        return elementStyler.set(key, to);
    },
    extendAPI: function (api, _a, config) {
        var props = _a.props,
            activeActions = _a.activeActions;
        var measure = props.dimensions.measure;
        var poserApi = __assign({}, api, { addChild: function (element, childConfig) {
                return api._addChild(createPoseConfig(element, childConfig), domPose);
            }, measure: measure, flip: function (op) {
                if (op) {
                    measure();
                    op();
                }
                return api.set('flip');
            } });
        props.elementStyler.render();
        appendEventListeners(props.element, activeActions, poserApi, config);
        return poserApi;
    }
});
var domPose$1 = function (element, config) {
    return domPose(createPoseConfig(element, config));
};

export default domPose$1;
