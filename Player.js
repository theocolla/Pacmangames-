import * as THREE from 'three';

export class Player {
    constructor(scene, world) {
        this.scene = scene;
        this.world = world;
        this.mesh = null;
        this.speed = 0.1;
        this.rotationSpeed = 0.05;

        // Position on the sphere (using spherical coordinates or just a vector on surface)
        // We'll use a quaternion to represent the player's orientation relative to the sphere center
        this.quaternion = new THREE.Quaternion();
        this.position = new THREE.Vector3(0, this.world.getRadius() + 1, 0);
        this.quaternion = new THREE.Quaternion();

        // Create mesh (Cube)
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshToonMaterial({ color: 0xffff00 }); // Yellow
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);

        // Set initial position
        this.mesh.position.copy(this.position);
        const up = this.position.clone().normalize();
        this.mesh.lookAt(new THREE.Vector3(0, 0, 0));

        this.isMoving = false;
        this.velocity = 0;
        this.lastPosition = this.mesh.position.clone();
    }

    update(input, delta, cameraController) {
        // Tank Controls
        this.isMoving = false;
        const previousPos = this.mesh.position.clone();

        // Left/Right: Rotate (Yaw)
        if (input.left) {
            this.rotate(1, delta);
        } else if (input.right) {
            this.rotate(-1, delta);
        }

        // Up: Move Forward
        if (input.up) {
            this.move(1, delta);
            this.isMoving = true;
        }
        // Removed backward movement as requested
        // else if (input.down) {
        //     this.move(-1, delta);
        // }

        // Calculate velocity for camera
        const currentPos = this.mesh.position.clone();
        this.velocity = currentPos.distanceTo(previousPos) / delta;

        // Update camera controller
        if (cameraController) {
            cameraController.update(delta, this.velocity);
        }
    }

    rotate(direction, delta) {
        const rotateSpeed = 2.0 * delta;
        const angle = direction * rotateSpeed;

        // Rotate around local Y (Up)
        const up = this.mesh.position.clone().normalize();
        const rotQuat = new THREE.Quaternion();
        rotQuat.setFromAxisAngle(up, angle);

        this.mesh.quaternion.premultiply(rotQuat);
    }

    move(direction, delta) {
        // Move forward/backward along local Z
        const moveSpeed = this.speed * 60 * delta;

        const originalPos = this.mesh.position.clone();
        const originalQuat = this.mesh.quaternion.clone();

        // 1. Get current basis vectors
        const up = this.mesh.position.clone().normalize();
        // Forward is local Z
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion).normalize();

        // 2. Calculate rotation axis to move along surface
        // To move Forward, we rotate around Right vector (Local X)
        // Axis = Up x Forward = Right (roughly)
        // Actually, to move "Forward" on sphere, we rotate around the axis perpendicular to Forward and Up.
        // Which IS the Right vector.

        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.mesh.quaternion).normalize();

        // Direction: 1 = Forward, -1 = Backward
        // If we rotate around Right axis by positive angle, we pitch down/forward?
        // Let's test sign.
        const angle = -direction * moveSpeed * 0.05;

        const rotQuat = new THREE.Quaternion();
        rotQuat.setFromAxisAngle(right, angle);

        // Apply rotation to position
        this.mesh.position.applyQuaternion(rotQuat);

        // Apply rotation to orientation (so feet stay down)
        this.mesh.quaternion.premultiply(rotQuat);

        // 2. Check collisions
        if (this.checkCollisions(this.world.obstacles)) {
            // Revert
            this.mesh.position.copy(originalPos);
            this.mesh.quaternion.copy(originalQuat);
        }
    }

    updateCamera(camera) {
        // 3rd Person Camera - Low angle behind player
        const up = this.mesh.position.clone().normalize();
        const playerPos = this.mesh.position.clone();

        // Camera parameters - very low angle, far behind
        const cameraHeight = 2;  // Very low, almost horizon level
        const cameraDist = 40;   // Far behind for wide view

        // Get player's backward vector
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);
        const back = forward.clone().negate();

        // Target position: Far behind, barely above
        const targetPos = playerPos.clone()
            .add(up.multiplyScalar(cameraHeight))
            .add(back.multiplyScalar(cameraDist));

        // Smoothly interpolate camera position
        camera.position.lerp(targetPos, 0.1);

        // Look target: Player position + slightly up
        const lookTarget = playerPos.clone().add(up.multiplyScalar(1));

        camera.lookAt(lookTarget);

        // Align up vector
        camera.up.lerp(up, 0.1);
    }

    checkCollisions(obstacles) {
        const playerRadius = 1; // Box is 2x2x2

        for (const obs of obstacles) {
            const dist = this.mesh.position.distanceTo(obs.mesh.position);
            const minDist = playerRadius + obs.radius;

            if (dist < minDist) {
                // Collision detected
                // Simple resolution: Push back?
                // Or just return true to block movement?
                return true;
            }
        }
        return false;
    }
}
