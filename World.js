
import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.radius = 60; // Increased from 20 to 60
        this.mesh = null;
        this.obstacles = []; // Trees, Rocks
        this.collectibles = []; // Coins, Power Pellets

        this.init();
    }

    init() {
        // Create the planet sphere
        const geometry = new THREE.SphereGeometry(this.radius, 64, 64);
        const material = new THREE.MeshToonMaterial({
            color: 0x66bb6a, // Brighter, more vibrant green
            flatShading: false
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.receiveShadow = true;
        this.scene.add(this.mesh);

        // Lighting - enhanced for better shadows
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x8b7355, 0.5); // Sky blue to brown
        this.scene.add(hemiLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(50, 100, 50);
        dirLight.castShadow = true;
        dirLight.shadow.camera.top = 50;
        dirLight.shadow.camera.bottom = -50;
        dirLight.shadow.camera.left = -50;
        dirLight.shadow.camera.right = 50;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        this.scene.add(dirLight);

        this.generateEnvironment();
        this.generateCollectibles();
    }

    generateEnvironment() {
        // Reduced counts by ~75% relative to surface area increase?
        // Old radius 20 -> Area ~5000. New radius 60 -> Area ~45000 (9x larger).
        // If we want "less density" than before, we shouldn't scale up linearly.
        // Let's keep counts low to make it sparse.
        const numTrees = 15;
        const numRocks = 10;
        const numBushes = 20;

        // Trees
        for (let i = 0; i < numTrees; i++) {
            const treeGroup = new THREE.Group();

            // Trunk
            const trunkGeo = new THREE.CylinderGeometry(0.3, 0.4, 2, 8);
            const trunkMat = new THREE.MeshToonMaterial({ color: 0xa0522d }); // Brighter brown
            const trunk = new THREE.Mesh(trunkGeo, trunkMat);
            trunk.position.y = 1;
            trunk.castShadow = true;
            treeGroup.add(trunk);

            // Leaves
            const leavesGeo = new THREE.ConeGeometry(1.5, 3, 8);
            const leavesMat = new THREE.MeshToonMaterial({ color: 0x32cd32 }); // Lime green
            const leaves = new THREE.Mesh(leavesGeo, leavesMat);
            leaves.position.y = 3;
            leaves.castShadow = true;
            treeGroup.add(leaves);

            this.placeObjectOnSphere(treeGroup, 2);
            this.scene.add(treeGroup);
            this.obstacles.push({ mesh: treeGroup, type: 'tree', radius: 1.5 });
        }

        // Rocks
        for (let i = 0; i < numRocks; i++) {
            const rockGeo = new THREE.DodecahedronGeometry(1.5, 0);
            const rockMat = new THREE.MeshToonMaterial({ color: 0x9e9e9e }); // Lighter gray
            const rock = new THREE.Mesh(rockGeo, rockMat);
            rock.scale.set(1 + Math.random() * 0.5, 0.8 + Math.random() * 0.4, 1 + Math.random() * 0.5);
            rock.castShadow = true;
            rock.receiveShadow = true;
            this.placeObjectOnSphere(rock, 0.5 * rock.scale.y);
            this.scene.add(rock);
            this.obstacles.push({ mesh: rock, type: 'rock', radius: rock.scale.x });
        }

        // Bushes
        const bushGeo = new THREE.SphereGeometry(0.6, 8, 8);
        const bushMat = new THREE.MeshToonMaterial({ color: 0x3d5a3d }); // Darker, richer green

        for (let i = 0; i < numBushes; i++) {
            const bush = new THREE.Mesh(bushGeo, bushMat);
            bush.castShadow = true;
            bush.scale.set(1, 0.7, 1);
            bush.receiveShadow = true;
            this.placeObjectOnSphere(bush, 0.3);
            this.scene.add(bush);
            this.obstacles.push({ mesh: bush, type: 'bush', radius: 0.6 * 0.7 }); // Adjusted radius based on new geometry and scale
        }
    }

    generateCollectibles() {
        const numCoins = 20; // Start with 20 coins for level 1
        const numPowerPellets = 5;

        // Create 3D coin model
        for (let i = 0; i < numCoins; i++) {
            const coin = this.createCoin();
            this.placeObjectOnSphere(coin, 0.3);
            this.scene.add(coin);
            this.collectibles.push({ mesh: coin, type: 'coin', radius: 0.5, active: true });
        }

        // Create strawberry power-up
        for (let i = 0; i < numPowerPellets; i++) {
            const strawberry = this.createStrawberry();
            this.placeObjectOnSphere(strawberry, 0.5);
            this.scene.add(strawberry);
            this.collectibles.push({ mesh: strawberry, type: 'power', radius: 0.8, active: true });
        }
    }

    createCoin() {
        const coinGroup = new THREE.Group();

        // Coin body (cylinder)
        const coinGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16);
        const coinMat = new THREE.MeshToonMaterial({
            color: 0xffd700,
            emissive: 0xaa8800
        });
        const coinMesh = new THREE.Mesh(coinGeo, coinMat);
        coinMesh.rotation.x = Math.PI / 2;
        coinGroup.add(coinMesh);

        // Add shine effect
        const shineGeo = new THREE.RingGeometry(0.2, 0.3, 16);
        const shineMat = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            side: THREE.DoubleSide
        });
        const shine = new THREE.Mesh(shineGeo, shineMat);
        shine.position.z = 0.06;
        coinGroup.add(shine);

        return coinGroup;
    }

    createStrawberry() {
        const strawberryGroup = new THREE.Group();

        // Berry body (sphere)
        const berryGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const berryMat = new THREE.MeshToonMaterial({
            color: 0xff0000,
            emissive: 0x880000
        });
        const berry = new THREE.Mesh(berryGeo, berryMat);
        berry.scale.y = 1.2; // Make it slightly elongated
        strawberryGroup.add(berry);

        // Seeds (small yellow dots)
        const seedGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const seedMat = new THREE.MeshToonMaterial({ color: 0xffff00 });

        for (let i = 0; i < 8; i++) {
            const seed = new THREE.Mesh(seedGeo, seedMat);
            const angle = (i / 8) * Math.PI * 2;
            seed.position.set(
                Math.cos(angle) * 0.3,
                Math.sin(angle) * 0.2,
                0.4
            );
            strawberryGroup.add(seed);
        }

        // Leaf on top
        const leafGeo = new THREE.ConeGeometry(0.3, 0.3, 3);
        const leafMat = new THREE.MeshToonMaterial({ color: 0x00ff00 });
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.y = 0.6;
        leaf.rotation.x = Math.PI;
        strawberryGroup.add(leaf);

        return strawberryGroup;
    }

    regenerateCollectibles(numCoins) {
        // Remove old coins
        for (let i = this.collectibles.length - 1; i >= 0; i--) {
            const item = this.collectibles[i];
            if (item.type === 'coin') {
                this.scene.remove(item.mesh);
                this.collectibles.splice(i, 1);
            } else {
                // Reset power pellets
                item.active = true;
                item.mesh.visible = true;
            }
        }

        // Add new coins
        for (let i = 0; i < numCoins; i++) {
            const coin = this.createCoin();
            this.placeObjectOnSphere(coin, 0.3);
            this.scene.add(coin);
            this.collectibles.push({ mesh: coin, type: 'coin', radius: 0.5, active: true });
        }
    }

    placeObjectOnSphere(object, heightOffset = 0) {
        // Random position on sphere
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.acos(2 * Math.random() - 1);

        const x = this.radius * Math.sin(theta) * Math.cos(phi);
        const y = this.radius * Math.cos(theta);
        const z = this.radius * Math.sin(theta) * Math.sin(phi);

        const surfacePos = new THREE.Vector3(x, y, z);
        const up = surfacePos.clone().normalize();

        // Position object at surface + height offset
        object.position.copy(surfacePos.add(up.clone().multiplyScalar(heightOffset)));

        // Align object with surface normal
        // "lookAt" makes the object's +Z axis point to the target.
        // If we want the object to stand UP on the sphere, its +Y axis should point along the normal.
        // The default lookAt behavior is not enough for "standing up" if the model is Y-up.

        // Standard way to align Y-up object to normal:
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), up);
        object.quaternion.copy(quaternion);

        // Add random rotation around the up axis (Y axis in local space)
        const randomRotation = new THREE.Quaternion();
        randomRotation.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI * 2);
        object.quaternion.multiply(randomRotation);
    }

    getRadius() {
        return this.radius;
    }
}
