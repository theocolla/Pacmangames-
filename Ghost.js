import * as THREE from 'three';

export class Ghost {
    constructor(scene, world, color = 0xff0000) {
        this.scene = scene;
        this.world = world;
        this.mesh = null;
        this.speed = 0.08; // Increased speed (was 0.05)
        this.direction = new THREE.Vector3(1, 0, 0); // Local tangent direction
        this.changeDirTimer = 0;

        this.state = 'SCATTER'; // SCATTER, CHASE, FLEE
        this.fleeTimer = 0;
        this.target = null; // Player to chase

        // Position on sphere
        this.position = new THREE.Vector3(0, world.getRadius() + 1, 0);
        this.quaternion = new THREE.Quaternion();

        this.init(color);
    }

    setTarget(player) {
        this.target = player;
    }

    setFlee() {
        this.state = 'FLEE';
        this.fleeTimer = 10;
        this.mesh.material.color.setHex(0x0000ff); // Blue
    }

    resetState() {
        this.state = 'CHASE'; // Fix: Go back to chasing the player
        this.mesh.material.color.setHex(this.originalColor);
    }

    init(color) {
        this.originalColor = color;

        // Simple Ghost shape: Cylinder with rounded top (Capsule-ish)
        // Or just a Box as requested "cubos/quadrados"? 
        // User said "volte como estava antes" (back to before) which was Capsule.
        // But also said "cubos/quadrados" (cubes/squares).
        // Let's go with a simple Box with rounded edges or just a Box to match "quadrados".
        // Actually, let's stick to the previous Capsule/Cylinder shape but maybe blockier?
        // Let's use a Box for now to satisfy "cubos".
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshToonMaterial({ color: color });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.scene.add(this.mesh);

        // Random start position
        this.placeRandomly();
    }

    placeRandomly() {
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        const r = this.world.getRadius() + 1.5; // Slightly above surface

        const x = r * Math.sin(theta) * Math.cos(phi);
        const y = r * Math.sin(theta) * Math.sin(phi);
        const z = r * Math.cos(theta);

        this.position.set(x, y, z);

        // Align up
        const up = this.position.clone().normalize();
        this.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);

        this.mesh.position.copy(this.position);
        this.mesh.quaternion.copy(this.quaternion);
    }

    update(delta, allGhosts) {
        if (this.state === 'FLEE') {
            this.fleeTimer -= delta;
            if (this.fleeTimer <= 0) {
                this.resetState();
            }
        }

        // AI Logic
        let moveDir = null;

        if (this.state === 'CHASE' && this.target) {
            moveDir = this.getChaseDirection(this.target.mesh.position);
        } else if (this.state === 'FLEE' && this.target) {
            moveDir = this.getFleeDirection(this.target.mesh.position);
        } else {
            this.changeDirTimer -= delta;
            if (this.changeDirTimer <= 0) {
                this.changeDirTimer = 2 + Math.random() * 3;
                const angle = Math.random() * Math.PI * 2;
                this.direction.set(Math.cos(angle), 0, Math.sin(angle));
            }
            moveDir = this.direction.clone();
        }

        // Apply Separation (avoid clumping)
        if (allGhosts) {
            const separation = this.getSeparationVector(allGhosts);
            if (moveDir) {
                moveDir.add(separation.multiplyScalar(1.5)); // Weight separation
                moveDir.normalize();
            }
        }

        if (moveDir) {
            this.move(moveDir, delta);
        }
    }

    getSeparationVector(ghosts) {
        const separation = new THREE.Vector3(0, 0, 0);
        const count = 0;
        const minDist = 3.0; // Minimum distance to keep from others

        for (const other of ghosts) {
            if (other === this) continue;

            const dist = this.mesh.position.distanceTo(other.mesh.position);
            if (dist < minDist && dist > 0) {
                // Vector away from other
                const push = this.mesh.position.clone().sub(other.mesh.position).normalize();
                // Weight by distance (closer = stronger push)
                push.divideScalar(dist);
                separation.add(push);
            }
        }

        // Project separation onto tangent plane so it works with spherical movement
        const up = this.mesh.position.clone().normalize();
        const tangentSep = separation.clone().sub(up.clone().multiplyScalar(separation.dot(up)));

        // Convert to local space
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.mesh.quaternion).normalize();
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion).normalize();

        const localX = tangentSep.dot(right);
        const localZ = tangentSep.dot(forward);

        return new THREE.Vector3(localX, 0, localZ);
    }

    getChaseDirection(targetPos) {
        return this.getDirectionTo(targetPos);
    }

    getFleeDirection(targetPos) {
        const dir = this.getDirectionTo(targetPos);
        return dir.negate();
    }

    getDirectionTo(targetPos) {
        const up = this.mesh.position.clone().normalize();
        const targetDir = targetPos.clone().sub(this.mesh.position).normalize();

        // Project targetDir onto tangent plane
        const tangentDir = targetDir.clone().sub(up.clone().multiplyScalar(targetDir.dot(up))).normalize();

        // Convert world tangent dir to local basis
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.mesh.quaternion).normalize();
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion).normalize();

        const localX = tangentDir.dot(right);
        const localZ = tangentDir.dot(forward);

        return new THREE.Vector3(localX, 0, localZ);
    }

    move(direction, delta) {
        const originalPos = this.mesh.position.clone();
        const originalQuat = this.mesh.quaternion.clone();

        // Same spherical movement logic as Player
        const up = this.mesh.position.clone().normalize();
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.mesh.quaternion).normalize();
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion).normalize();

        const moveSpeed = this.speed * 60 * delta;

        const worldMove = right.clone().multiplyScalar(direction.x).add(forward.clone().multiplyScalar(direction.z)).normalize();
        const axis = new THREE.Vector3().crossVectors(up, worldMove).normalize();
        const angle = moveSpeed * 0.05;

        const rotQuat = new THREE.Quaternion();
        rotQuat.setFromAxisAngle(axis, angle);

        this.mesh.position.applyQuaternion(rotQuat);
        this.mesh.quaternion.premultiply(rotQuat);

        // Check collisions with obstacles
        if (this.checkCollisions(this.world.obstacles)) {
            // Revert position
            this.mesh.position.copy(originalPos);
            this.mesh.quaternion.copy(originalQuat);

            // Pick a new random direction to get unstuck
            const angle = Math.random() * Math.PI * 2;
            this.direction.set(Math.cos(angle), 0, Math.sin(angle));
        }
    }

    checkCollisions(obstacles) {
        const ghostRadius = 1;
        for (const obs of obstacles) {
            const dist = this.mesh.position.distanceTo(obs.mesh.position);
            const minDist = ghostRadius + obs.radius;
            if (dist < minDist) {
                return true;
            }
        }
        return false;
    }
}
