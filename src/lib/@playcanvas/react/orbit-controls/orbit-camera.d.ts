import { Script, Vec3, Quat, Vec2, Entity } from 'playcanvas'; // Import necessary PlayCanvas types

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
    set pitchAngleMax(v: number);
    get pitchAngleMax(): number;
    _pitchAngleMax: number;
    _pitch: number;
    /**
     * @attribute
     * @title Pitch Angle Min (degrees)
     * @type {number}
     */
    set pitchAngleMin(v: number);
    get pitchAngleMin(): number;
    _pitchAngleMin: number;
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
    set focusEntity(value: Entity);
    get focusEntity(): Entity;
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
    _targetDistance: number;
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
    set pitch(value: number);
    get pitch(): number;
    _targetPitch: number;
    /**
     * Property to get and set the yaw of the camera around the pivot point (degrees)
     *
     * @type {number}
     */
    set yaw(value: number);
    get yaw(): number;
    _targetYaw: number;
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
    focus(focusEntity: Entity): void;
    resetAndLookAtPoint(resetPoint: Vec3, lookAtPoint: Vec3): void;
    resetAndLookAtEntity(resetPoint: Vec3, entity: Entity): void;
    reset(yaw: number, pitch: number, distance: number): void;
    initialize(): void;
    _yaw: number;
    update(dt: number): void;
    _updatePosition(): void;
    _removeInertia(): void;
    _checkAspectRatio(): void;
    _buildAabb(entity: Entity): void;
    _calcYaw(quat: Quat): number;
    _clampDistance(distance: number): number;
    _clampPitchAngle(pitch: number): number;
    _calcPitch(quat: Quat, yaw: number): number;
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
    orbitCamera: OrbitCamera;
    lookButtonDown: boolean | undefined;
    panButtonDown: boolean | undefined;
    lastPoint: Vec2 | undefined;
    pan(screenPoint: Vec2): void;
    onMouseDown(event: MouseEvent): void;
    onMouseUp(event: MouseEvent): void;
    onMouseMove(event: MouseEvent): void;
    onMouseWheel(event: WheelEvent): void; // WheelEvent for mouse wheel
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
    orbitCamera: OrbitCamera;
    lastTouchPoint: Vec2 | undefined;
    lastPinchMidPoint: Vec2 | undefined;
    lastPinchDistance: number | undefined;
    getPinchDistance(pointA: Vec2, pointB: Vec2): number;
    calcMidPoint(pointA: Vec2, pointB: Vec2, result: Vec2): void;
    onTouchStartEndCancel(event: TouchEvent): void;
    pan(midPoint: Vec2): void;
    onTouchMove(event: TouchEvent): void;
}
