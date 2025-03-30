import * as THREE from 'three';

export class UFOSystem {
    constructor(scene) {
        this.scene = scene;
        this.ufos = [];
        this.patrolRadius = 60;
        this.playerAvoidanceRadius = 40;
        this.buildingAvoidanceRadius = 20;
        this.minHeight = 25;
        this.maxHeight = 45;
        this.smoothingFactor = 0.1; // For smooth transitions
        
        // Create UFOs
        this.createUFOs(5);
    }

    createUFOs(count) {
        for (let i = 0; i < count; i++) {
            const ufo = this.createUFO();
            
            // Set up patrol parameters with smoother movement
            ufo.userData = {
                patrolAngle: Math.random() * Math.PI * 2,
                patrolSpeed: 0.1 + Math.random() * 0.15, // Reduced speed range
                patrolHeight: this.minHeight + Math.random() * (this.maxHeight - this.minHeight),
                patrolRadius: this.patrolRadius + (Math.random() - 0.5) * 20,
                patrolPattern: Math.random() > 0.5 ? 'circle' : 'figure8',
                phase: Math.random() * Math.PI * 2,
                isAvoiding: false,
                avoidanceVector: new THREE.Vector3(),
                currentVelocity: new THREE.Vector3(),
                targetPosition: new THREE.Vector3(),
                currentRotation: new THREE.Quaternion(),
                targetRotation: new THREE.Quaternion()
            };
            
            // Initial position
            const angle = ufo.userData.patrolAngle;
            const radius = ufo.userData.patrolRadius;
            ufo.position.set(
                Math.cos(angle) * radius,
                ufo.userData.patrolHeight,
                Math.sin(angle) * radius
            );
            
            this.ufos.push(ufo);
            this.scene.add(ufo);
        }
    }

    createUFO() {
        const group = new THREE.Group();

        // Main saucer body
        const saucerGeometry = new THREE.CapsuleGeometry(3, 0.5, 32, 16);
        const saucerMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x8B0000,
            metalness: 0.8,
            shininess: 60
        });
        const saucer = new THREE.Mesh(saucerGeometry, saucerMaterial);
        saucer.rotation.z = Math.PI / 2;
        group.add(saucer);

        // Top dome
        const domeGeometry = new THREE.SphereGeometry(1.5, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const domeMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x8B0000,
            metalness: 0.8,
            shininess: 60
        });
        const dome = new THREE.Mesh(domeGeometry, domeMaterial);
        dome.position.y = 0.5;
        group.add(dome);

        // Bottom rim
        const rimGeometry = new THREE.TorusGeometry(3.2, 0.3, 16, 32);
        const rimMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x600000,
            metalness: 0.9,
            shininess: 70
        });
        const rim = new THREE.Mesh(rimGeometry, rimMaterial);
        rim.rotation.x = Math.PI / 2;
        rim.position.y = -0.2;
        group.add(rim);

        return group;
    }

    updatePatrol(ufo, deltaTime) {
        const data = ufo.userData;
        
        // Calculate target position
        if (data.patrolPattern === 'circle') {
            data.patrolAngle += data.patrolSpeed * deltaTime;
            data.targetPosition.set(
                Math.cos(data.patrolAngle) * data.patrolRadius,
                data.patrolHeight,
                Math.sin(data.patrolAngle) * data.patrolRadius
            );
        } else {
            data.patrolAngle += data.patrolSpeed * deltaTime;
            const scale = data.patrolRadius * 0.7;
            data.targetPosition.set(
                Math.sin(data.patrolAngle) * scale,
                data.patrolHeight,
                Math.sin(data.patrolAngle * 2) * scale * 0.5
            );
        }

        // Smooth position transition
        ufo.position.lerp(data.targetPosition, this.smoothingFactor);
        
        // Calculate and smooth rotation
        const direction = data.targetPosition.clone().sub(ufo.position).normalize();
        data.targetRotation.setFromRotationMatrix(
            new THREE.Matrix4().lookAt(
                ufo.position,
                ufo.position.clone().add(direction),
                new THREE.Vector3(0, 1, 0)
            )
        );
        ufo.quaternion.slerp(data.targetRotation, this.smoothingFactor);
    }

    handlePlayerAvoidance(ufo, playerPosition) {
        const data = ufo.userData;
        const distanceToPlayer = ufo.position.distanceTo(playerPosition);
        
        if (distanceToPlayer < this.playerAvoidanceRadius) {
            // Calculate smooth avoidance vector
            data.avoidanceVector.copy(ufo.position)
                .sub(playerPosition)
                .normalize()
                .multiplyScalar(this.playerAvoidanceRadius - distanceToPlayer);
            
            data.isAvoiding = true;
            
            // Set target position away from player
            data.targetPosition.copy(ufo.position).add(data.avoidanceVector);
            
            // Smooth position transition
            ufo.position.lerp(data.targetPosition, this.smoothingFactor);
            
            // Smooth rotation to face player
            data.targetRotation.setFromRotationMatrix(
                new THREE.Matrix4().lookAt(
                    ufo.position,
                    playerPosition,
                    new THREE.Vector3(0, 1, 0)
                )
            );
            ufo.quaternion.slerp(data.targetRotation, this.smoothingFactor);
            
            return true;
        }
        
        data.isAvoiding = false;
        return false;
    }

    handleEnvironmentAvoidance(ufo, buildings) {
        const data = ufo.userData;
        const position = ufo.position.clone();
        let isAvoiding = false;
        
        // Reset avoidance vector
        data.avoidanceVector.set(0, 0, 0);
        
        // Check building collisions
        for (const building of buildings) {
            if (!building.geometry) continue; // Skip if not a mesh
            
            const distanceToBuilding = position.distanceTo(building.position);
            const buildingHeight = building.scale.y * 10;
            
            if (distanceToBuilding < this.buildingAvoidanceRadius && 
                position.y < buildingHeight + 10) {
                // Accumulate avoidance vectors
                const avoidDir = position.clone()
                    .sub(building.position)
                    .normalize()
                    .multiplyScalar(this.buildingAvoidanceRadius - distanceToBuilding);
                data.avoidanceVector.add(avoidDir);
                isAvoiding = true;
            }
        }
        
        // Apply accumulated avoidance
        if (isAvoiding) {
            data.avoidanceVector.normalize().multiplyScalar(2);
            data.targetPosition.copy(ufo.position).add(data.avoidanceVector);
            ufo.position.lerp(data.targetPosition, this.smoothingFactor);
        }
        
        // Smooth height maintenance
        if (position.y < this.minHeight) {
            data.targetPosition.y = this.minHeight;
            ufo.position.lerp(data.targetPosition, this.smoothingFactor);
            isAvoiding = true;
        } else if (position.y > this.maxHeight) {
            data.targetPosition.y = this.maxHeight;
            ufo.position.lerp(data.targetPosition, this.smoothingFactor);
            isAvoiding = true;
        }
        
        return isAvoiding;
    }

    update(deltaTime, playerPosition, buildings) {
        for (const ufo of this.ufos) {
            const isAvoidingPlayer = this.handlePlayerAvoidance(ufo, playerPosition);
            const isAvoidingEnvironment = this.handleEnvironmentAvoidance(ufo, buildings);
            
            if (!isAvoidingPlayer && !isAvoidingEnvironment) {
                this.updatePatrol(ufo, deltaTime);
            }
            
            // Add subtle hovering motion
            const hoverOffset = Math.sin(performance.now() * 0.001 + ufo.userData.phase) * 0.05;
            ufo.position.y += hoverOffset;
        }
    }
} 