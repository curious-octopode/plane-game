import * as THREE from 'three';

export class FlightSystem {
    constructor() {
        // Flight parameters
        this.speed = 0;
        this.minSpeed = 0.2;
        this.maxSpeed = 2;
        this.acceleration = 0.5;
        this.deceleration = 0.3;
        
        // Control sensitivity
        this.pitchSensitivity = 0.8;
        this.turnSensitivity = 1.5;
        this.rollSensitivity = 2.0;
        
        // Input state
        this.input = {
            pitch: 0,
            roll: 0,
            yaw: 0,
            speedDelta: 0
        };
        
        // Physical limits
        this.maxPitchAngle = THREE.MathUtils.degToRad(60);
        this.maxBankAngle = THREE.MathUtils.degToRad(45);
        
        // Auto-leveling parameters
        this.autoLevelStrength = 0.1;
        this.autoLevelThreshold = 0.01;
        
        // Current rotation state (using quaternion)
        this.rotation = new THREE.Quaternion();
        this.targetRotation = new THREE.Quaternion();
        
        // Temporary objects for calculations
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        this.tempQuaternion = new THREE.Quaternion();
        
        // Key state
        this.keyStates = {
            w: false,
            s: false,
            a: false,
            d: false,
            q: false,
            e: false
        };
        
        // Auto-leveling parameters
        this.autoBankAmount = 0;
        this.autoPitchAmount = 0;
        this.throttleAmount = 0.5;
        
        // Bind event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    
    handleKeyDown(e) {
        if (this.keyStates.hasOwnProperty(e.key.toLowerCase())) {
            this.keyStates[e.key.toLowerCase()] = true;
        }
    }
    
    handleKeyUp(e) {
        if (this.keyStates.hasOwnProperty(e.key.toLowerCase())) {
            this.keyStates[e.key.toLowerCase()] = false;
        }
    }
    
    normalizeInput(value) {
        return THREE.MathUtils.clamp(value, -1, 1);
    }
    
    updateInputs(deltaTime) {
        // Reset inputs
        this.input.pitch = 0;
        this.input.roll = 0;
        this.input.speedDelta = 0;
        
        // Process key states
        if (this.keyStates.w) this.input.pitch -= 1;
        if (this.keyStates.s) this.input.pitch += 1;
        if (this.keyStates.a) this.input.roll -= 1;
        if (this.keyStates.d) this.input.roll += 1;
        if (this.keyStates.q) this.input.speedDelta -= 1;
        if (this.keyStates.e) this.input.speedDelta += 1;
        
        // Normalize inputs
        this.input.pitch = this.normalizeInput(this.input.pitch);
        this.input.roll = this.normalizeInput(this.input.roll);
        this.input.speedDelta = this.normalizeInput(this.input.speedDelta);
        
        // Calculate yaw from roll (coupled turning)
        this.input.yaw = -this.input.roll * this.turnSensitivity * deltaTime;
    }
    
    updatePhysics(deltaTime) {
        // Create rotation quaternions
        const pitchAmount = (this.keyStates.w ? 1 : 0) - (this.keyStates.s ? 1 : 0) + this.autoPitchAmount;
        const rollAmount = (this.keyStates.d ? 1 : 0) - (this.keyStates.a ? 1 : 0) + this.autoBankAmount;
        
        const pitchQuat = new THREE.Quaternion();
        pitchQuat.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -pitchAmount * this.pitchSensitivity * deltaTime);
        
        const rollQuat = new THREE.Quaternion();
        rollQuat.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -rollAmount * this.rollSensitivity * deltaTime);
        
        // Apply rotations
        this.rotation.multiply(pitchQuat);
        this.rotation.multiply(rollQuat);
        
        // Update velocity direction based on rotation
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.rotation);
        
        // Update speed based on throttle
        const targetSpeed = this.minSpeed + (this.maxSpeed - this.minSpeed) * this.throttleAmount;
        if (this.speed < targetSpeed) {
            this.speed = Math.min(targetSpeed, this.speed + this.acceleration * deltaTime);
        } else if (this.speed > targetSpeed) {
            this.speed = Math.max(targetSpeed, this.speed - this.deceleration * deltaTime);
        }
        
        return {
            velocity: forward.multiplyScalar(this.speed),
            rotation: this.rotation,
            speed: this.speed
        };
    }
    
    getSpeed() {
        return this.speed;
    }
    
    getSpeedNormalized() {
        return (this.speed - this.minSpeed) / (this.maxSpeed - this.minSpeed);
    }

    setAutoBanking(amount) {
        this.autoBankAmount = Math.max(-1, Math.min(1, amount));
    }

    setPitch(amount) {
        this.autoPitchAmount = Math.max(-1, Math.min(1, amount));
    }

    setThrottle(amount) {
        this.throttleAmount = Math.max(0, Math.min(1, amount));
    }
} 