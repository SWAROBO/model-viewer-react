export class OrbitCamera extends Script {
    static __name: string;
    static fromWorldPoint: Vec3;
    static toWorldPoint: Vec3;
    static worldDiff: Vec3;
    static distanceBetween: Vec3;
    static quatWithoutYaw: Quat;
    static yawOffset: Quat;
    /**
     * @attribute
     * @title Distance Max
     * @type {number}
     */
    set distanceMax(v: number);
    get distanceMax(): number;
    /** @private */
    private _distanceMax;
    /** @private */
    private _distance;
    /**
     * @attribute
     * @title Distance Min
     * @type {number}
     */
    set distanceMin(v: number);
    get distanceMin(): number;
    /** @private */
    private _distanceMin;
    /**
     * @attribute
     * @title Pitch Angle Max (degrees)
     * @type {number}
     */
    set pitchAngleMax(v: any);
    get pitchAngleMax(): any;
    _pitchAngleMax: any;
    _pitch: any;
    /**
     * @attribute
     * @title Pitch Angle Min (degrees)
     * @type {number}
     */
    set pitchAngleMin(v: any);
    get pitchAngleMin(): any;
    _pitchAngleMin: any;
    /**
     * Higher value means that the camera will continue moving after the user has stopped dragging. 0 is fully responsive.
     *
     * @attribute
     * @title Inertia Factor
     * @type {number}
     */
    inertiaFactor: number;
    /**
     * Entity for the camera to focus on. If blank, then the camera will use the whole scene
     *
     * @attribute
     * @title Focus Entity
     * @type {Entity}
     */
    set focusEntity(value: any);
    get focusEntity(): any;
    /** @private */
    private _focusEntity;
    /**
     * Frames the entity or scene at the start of the application."
     *
     * @attribute
     * @title Frame on Start
     * @type {boolean}
     */
    set frameOnStart(value: boolean);
    get frameOnStart(): boolean;
    /** @private */
    private _frameOnStart;
    /**
     * Property to get and set the distance between the pivot point and camera.
     * Clamped between this.distanceMin and this.distanceMax
     *
     * @type {number}
     */
    set distance(value: number | undefined);
    get distance(): number | undefined;
    _targetDistance: any;
    /**
     * Property to get and set the camera orthoHeight
     *
     * @type {number}
     */
    set orthoHeight(value: number);
    get orthoHeight(): number;
    /**
     * Property to get and set the pitch of the camera around the pivot point (degrees).
     * Clamped between this.pitchAngleMin and this.pitchAngleMax.
     * When set at 0, the camera angle is flat, looking along the horizon
     *
     * @type {number}
     */
    set pitch(value: any);
    get pitch(): any;
    _targetPitch: any;
    /**
     * Property to get and set the yaw of the camera around the pivot point (degrees)
     *
     * @type {number}
     */
    set yaw(value: any);
    get yaw(): any;
    _targetYaw: any;
    /**
     * Property to get and set the world position of the pivot point that the camera orbits around
     *
     * @type {number}
     */
    set pivotPoint(value: Vec3);
    get pivotPoint(): Vec3;
    /** @private */
    private _modelsAabb;
    _pivotPoint: Vec3;
    focus(focusEntity: any): void;
    resetAndLookAtPoint(resetPoint: any, lookAtPoint: any): void;
    resetAndLookAtEntity(resetPoint: any, entity: any): void;
    reset(yaw: any, pitch: any, distance: any): void;
    initialize(): void;
    _yaw: any;
    update(dt: any): void;
    _updatePosition(): void;
    _removeInertia(): void;
    _checkAspectRatio(): void;
    _buildAabb(entity: any): void;
    _calcYaw(quat: any): number;
    _clampDistance(distance: any): number;
    _clampPitchAngle(pitch: any): number;
    _calcPitch(quat: any, yaw: any): number;
}
export class OrbitCameraInputMouse extends Script {
    static __name: string;
    static fromWorldPoint: Vec3;
    static toWorldPoint: Vec3;
    static worldDiff: Vec3;
    /**
     * How fast the camera moves around the orbit. Higher is faster
     *
     * @attribute
     * @type {number.0}
     */
    orbitSensitivity: number;
    /**
     * How fast the camera moves in and out. Higher is faster
     *
     * @attribute
     * @type {number}
     */
    distanceSensitivity: number;
    initialize(): void;
    orbitCamera: any;
    lookButtonDown: boolean | undefined;
    panButtonDown: boolean | undefined;
    lastPoint: Vec2 | undefined;
    pan(screenPoint: any): void;
    onMouseDown(event: any): void;
    onMouseUp(event: any): void;
    onMouseMove(event: any): void;
    onMouseWheel(event: any): void;
    onMouseOut(): void;
}
export class OrbitCameraInputTouch extends Script {
    static __name: string;
    static pinchMidPoint: Vec2;
    static fromWorldPoint: Vec3;
    static toWorldPoint: Vec3;
    static worldDiff: Vec3;
    /**
     * How fast the camera moves around the orbit. Higher is faster
     *
     * @attribute
     * @type {number}
     */
    orbitSensitivity: number;
    /**
     * How fast the camera moves in and out. Higher is faster
     *
     * @attribute
     * @type {number}
     */
    distanceSensitivity: number;
    initialize(): void;
    orbitCamera: any;
    lastTouchPoint: Vec2 | undefined;
    lastPinchMidPoint: Vec2 | undefined;
    lastPinchDistance: number | undefined;
    getPinchDistance(pointA: any, pointB: any): number;
    calcMidPoint(pointA: any, pointB: any, result: any): void;
    onTouchStartEndCancel(event: any): void;
    pan(midPoint: any): void;
    onTouchMove(event: any): void;
}
import { Script } from 'playcanvas';
import { Vec3 } from 'playcanvas';
import { Quat } from 'playcanvas';
import { Vec2 } from 'playcanvas';
