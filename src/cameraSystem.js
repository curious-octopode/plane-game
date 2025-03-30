import * as THREE from 'three';

export class CameraSystem {
    constructor(camera) {
        this.camera = camera;
        this.mode = 'follow'; // 'follow' or 'orbit'
        
        // Follow camera parameters
        this.followDistance = 15;
        this.followHeight = 5;
        this.followLerp = 0.1;
        
        // Orbit parameters
        this.orbitRadius = 50;
        this.orbitHeight = 40;
        this.orbitSpeed = 0.015;
        this.orbitAngle = 0;
        
        // Camera position and target
        this.currentPosition = new THREE.Vector3();
        this.targetPosition = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();
        this.targetLookAt = new THREE.Vector3();
        
        // Bind event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'c') {
                this.toggleMode();
            }
        });
    }
    
    toggleMode() {
        this.mode = this.mode === 'follow' ? 'orbit' : 'follow';
    }
    
    update(planePosition, planeQuaternion, deltaTime) {
        if (this.mode === 'follow') {
            this.updateFollowCamera(planePosition, planeQuaternion);
        } else {
            this.updateOrbitCamera(planePosition);
        }
        
        // Smoothly interpolate camera position and lookAt
        this.currentPosition.lerp(this.targetPosition, this.followLerp);
        this.currentLookAt.lerp(this.targetLookAt, this.followLerp);
        
        // Update camera
        this.camera.position.copy(this.currentPosition);
        this.camera.lookAt(this.currentLookAt);
    }
    
    updateFollowCamera(planePosition, planeQuaternion) {
        // Calculate offset based on plane's orientation
        const offset = new THREE.Vector3(0, this.followHeight, this.followDistance);
        offset.applyQuaternion(planeQuaternion);
        
        // Set target position behind and above plane
        this.targetPosition.copy(planePosition).add(offset);
        this.targetLookAt.copy(planePosition);
    }
    
    updateOrbitCamera(planePosition) {
        this.orbitAngle += this.orbitSpeed;
        
        // Calculate orbit position
        this.targetPosition.x = planePosition.x + this.orbitRadius * Math.cos(this.orbitAngle);
        this.targetPosition.z = planePosition.z + this.orbitRadius * Math.sin(this.orbitAngle);
        this.targetPosition.y = planePosition.y + this.orbitHeight;
        
        this.targetLookAt.copy(planePosition);
    }
} 