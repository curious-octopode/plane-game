import * as THREE from 'three';

export class ProjectileSystem {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = [];
        this.projectileSpeed = 50;
        this.projectileLifetime = 5;
        
        // Define projectile colors
        this.projectileColors = [
            { color: 0xffd700, emissive: 0xffd700 }, // Bright yellow
            { color: 0xffa500, emissive: 0xffa500 }, // Orange
            { color: 0xff8c00, emissive: 0xff8c00 }, // Dark orange
            { color: 0xffeb3b, emissive: 0xffeb3b }, // Light yellow
            { color: 0xffc107, emissive: 0xffc107 }  // Amber
        ];
    }

    shoot(position, direction) {
        // Randomly select a color from our palette
        const colorIndex = Math.floor(Math.random() * this.projectileColors.length);
        const { color, emissive } = this.projectileColors[colorIndex];
        
        // Create projectile geometry
        const geometry = new THREE.SphereGeometry(0.3, 16, 16);
        const material = new THREE.MeshPhongMaterial({
            color: color,
            emissive: emissive,
            emissiveIntensity: 1.0
        });
        
        const projectile = new THREE.Mesh(geometry, material);
        projectile.position.copy(position);
        
        // Store projectile data
        projectile.userData = {
            direction: direction.clone(),
            lifetime: this.projectileLifetime,
            speed: this.projectileSpeed
        };
        
        this.projectiles.push(projectile);
        this.scene.add(projectile);
    }

    update(deltaTime) {
        // Update each projectile
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            const userData = projectile.userData;
            
            // Move projectile
            const movement = userData.direction.clone().multiplyScalar(userData.speed * deltaTime);
            projectile.position.add(movement);
            
            // Update lifetime
            userData.lifetime -= deltaTime;
            
            // Remove if expired
            if (userData.lifetime <= 0) {
                this.scene.remove(projectile);
                this.projectiles.splice(i, 1);
            }
        }
    }

    checkCollisions(ufos) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            for (const ufo of ufos) {
                // Calculate distance between projectile and UFO
                const distance = projectile.position.distanceTo(ufo.position);
                
                // Check if projectile hit UFO (using UFO's radius of 3 units)
                if (distance < 3) {
                    // Remove projectile
                    this.scene.remove(projectile);
                    this.projectiles.splice(i, 1);
                    
                    // Create explosion effect
                    this.createExplosion(projectile.position);
                    
                    return ufo;
                }
            }
        }
        return null;
    }

    createExplosion(position) {
        // Create particle system for explosion
        const particleCount = 30;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            // Random direction
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const speed = 3 + Math.random() * 4;
            
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;
            
            velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
            velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
            velocities[i * 3 + 2] = Math.cos(phi) * speed;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0xff6600,
            size: 0.3,
            transparent: true,
            opacity: 1
        });
        
        const particles = new THREE.Points(geometry, material);
        particles.userData = {
            lifetime: 1.5,
            velocities: velocities
        };
        
        this.scene.add(particles);
        
        // Remove particles after animation
        setTimeout(() => {
            this.scene.remove(particles);
        }, 1500);
    }
} 