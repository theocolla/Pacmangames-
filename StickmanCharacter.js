import * as THREE from 'three';

export class StickmanCharacter {
    constructor(scene, color = 0xffff00, isPlayer = true) {
        this.scene = scene;
        this.color = color;
        this.isPlayer = isPlayer;
        this.animationTime = 0;

        this.createStickman();
    }

    createStickman() {
        this.group = new THREE.Group();

        // Head (larger circle)
        const headGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const headMat = new THREE.MeshToonMaterial({ color: this.color });
        this.head = new THREE.Mesh(headGeo, headMat);
        this.head.position.y = 1.2;
        this.head.castShadow = true;
        this.group.add(this.head);

        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.1, 8, 8);
        const eyeMat = new THREE.MeshToonMaterial({ color: 0x000000 });

        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.15, 1.3, 0.4);
        this.group.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.15, 1.3, 0.4);
        this.group.add(rightEye);

        // Body (cylinder)
        const bodyGeo = new THREE.CylinderGeometry(0.2, 0.25, 1, 8);
        const bodyMat = new THREE.MeshToonMaterial({ color: this.color });
        this.body = new THREE.Mesh(bodyGeo, bodyMat);
        this.body.position.y = 0.5;
        this.body.castShadow = true;
        this.group.add(this.body);

        // Arms
        const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 6);
        const armMat = new THREE.MeshToonMaterial({ color: this.color });

        this.leftArm = new THREE.Mesh(armGeo, armMat);
        this.leftArm.position.set(-0.35, 0.7, 0);
        this.leftArm.rotation.z = 0.3;
        this.leftArm.castShadow = true;
        this.group.add(this.leftArm);

        this.rightArm = new THREE.Mesh(armGeo, armMat);
        this.rightArm.position.set(0.35, 0.7, 0);
        this.rightArm.rotation.z = -0.3;
        this.rightArm.castShadow = true;
        this.group.add(this.rightArm);

        // Legs
        const legGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.7, 6);
        const legMat = new THREE.MeshToonMaterial({ color: this.color });

        this.leftLeg = new THREE.Mesh(legGeo, legMat);
        this.leftLeg.position.set(-0.15, -0.35, 0);
        this.leftLeg.castShadow = true;
        this.group.add(this.leftLeg);

        this.rightLeg = new THREE.Mesh(legGeo, legMat);
        this.rightLeg.position.set(0.15, -0.35, 0);
        this.rightLeg.castShadow = true;
        this.group.add(this.rightLeg);

        this.scene.add(this.group);
    }

    animate(delta, isMoving) {
        if (!isMoving) {
            // Reset to idle pose
            this.leftArm.rotation.x = 0;
            this.rightArm.rotation.x = 0;
            this.leftLeg.rotation.x = 0;
            this.rightLeg.rotation.x = 0;
            return;
        }

        this.animationTime += delta * 8;

        // Animate arms
        this.leftArm.rotation.x = Math.sin(this.animationTime) * 0.5;
        this.rightArm.rotation.x = -Math.sin(this.animationTime) * 0.5;

        // Animate legs
        this.leftLeg.rotation.x = Math.sin(this.animationTime) * 0.6;
        this.rightLeg.rotation.x = -Math.sin(this.animationTime) * 0.6;
    }

    setPosition(position) {
        this.group.position.copy(position);
    }

    setQuaternion(quaternion) {
        this.group.quaternion.copy(quaternion);
    }

    remove() {
        this.scene.remove(this.group);
    }
}
