import * as THREE from 'three';

export class CameraController {
    constructor(camera, world) {
        this.camera = camera;
        this.world = world;
        this.target = null;

        // Camera parameters
        this.baseDistance = 40;
        this.minDistance = 25;
        this.maxDistance = 50;
        this.baseHeight = 8;
        this.smoothness = 0.08;
        this.rotationSpeed = 0.05;

        // State
        this.currentDistance = this.baseDistance;
        this.currentHeight = this.baseHeight;
        this.desiredPosition = new THREE.Vector3();
        this.desiredLookAt = new THREE.Vector3();

        // Collision detection
        this.raycaster = new THREE.Raycaster();
        this.collisionPadding = 2;
    }

    setTarget(target) {
        this.target = target;
    }

    update(delta, playerVelocity = 0) {
        if (!this.target) return;

        const targetPos = this.target.mesh.position.clone();
        const up = targetPos.clone().normalize();

        // Adaptive distance based on speed
        const speedFactor = Math.min(playerVelocity * 2, 1);
        this.currentDistance = THREE.MathUtils.lerp(
            this.baseDistance,
            this.maxDistance,
            speedFactor
        );

        // Get player's backward direction
        const forward = new THREE.Vector3(0, 0, 1)
            .applyQuaternion(this.target.mesh.quaternion);
        const back = forward.clone().negate();

        // Calculate desired camera position
        this.desiredPosition.copy(targetPos)
            .add(up.clone().multiplyScalar(this.currentHeight))
            .add(back.clone().multiplyScalar(this.currentDistance));

        // Check for collisions and adjust position
        this.handleCollisions(targetPos, this.desiredPosition);

        // Smooth camera movement
        this.camera.position.lerp(this.desiredPosition, this.smoothness);

        // Look at target with slight offset
        this.desiredLookAt.copy(targetPos).add(up.clone().multiplyScalar(2));

        // Smooth look-at
        const currentLookAt = new THREE.Vector3();
        this.camera.getWorldDirection(currentLookAt);
        currentLookAt.multiplyScalar(10).add(this.camera.position);
        currentLookAt.lerp(this.desiredLookAt, this.smoothness * 2);

        this.camera.lookAt(currentLookAt);

        // Maintain proper up vector
        this.camera.up.lerp(up, this.smoothness);
    }

    handleCollisions(targetPos, desiredPos) {
        // Cast ray from target to desired camera position
        const direction = desiredPos.clone().sub(targetPos).normalize();
        const distance = targetPos.distanceTo(desiredPos);

        this.raycaster.set(targetPos, direction);
        this.raycaster.far = distance;

        // Check collisions with obstacles
        const obstacles = this.world.obstacles.map(obs => obs.mesh);
        const intersects = this.raycaster.intersectObjects(obstacles, true);

        if (intersects.length > 0) {
            // Move camera closer to avoid collision
            const hitDistance = intersects[0].distance - this.collisionPadding;
            if (hitDistance < distance) {
                desiredPos.copy(targetPos).add(
                    direction.multiplyScalar(Math.max(hitDistance, this.minDistance))
                );
            }
        }

        // Also check collision with planet surface
        const planetCenter = new THREE.Vector3(0, 0, 0);
        const distanceFromCenter = desiredPos.length();
        const minDistanceFromCenter = this.world.getRadius() + 5;

        if (distanceFromCenter < minDistanceFromCenter) {
            // Push camera away from planet surface
            desiredPos.normalize().multiplyScalar(minDistanceFromCenter);
        }
    }

    // Allow manual camera adjustments
    setDistance(distance) {
        this.baseDistance = THREE.MathUtils.clamp(distance, this.minDistance, this.maxDistance);
    }

    setHeight(height) {
        this.baseHeight = height;
    }

    setSmoothness(smoothness) {
        this.smoothness = THREE.MathUtils.clamp(smoothness, 0.01, 0.5);
    }
}
