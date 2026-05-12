import * as THREE from 'three';

/**
 * Simple outline effect for cartoon/cel-shading style
 * Creates black outlines around objects by rendering them slightly larger with a black material
 */
export class OutlineEffect {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        // Outline parameters
        this.outlineThickness = 0.03;
        this.outlineColor = new THREE.Color(0x000000);

        // Store original materials
        this.originalMaterials = new Map();

        // Create outline material
        this.outlineMaterial = new THREE.MeshBasicMaterial({
            color: this.outlineColor,
            side: THREE.BackSide
        });
    }

    render() {
        // First pass: Render outlines
        this.renderOutlines();

        // Second pass: Render normal scene
        this.renderer.render(this.scene, this.camera);
    }

    renderOutlines() {
        // Save original materials and apply outline effect
        this.scene.traverse((object) => {
            if (object.isMesh && object.visible) {
                // Skip invisible collision meshes
                if (object.material && object.material.visible === false) return;

                // Store original material
                this.originalMaterials.set(object, {
                    material: object.material,
                    scale: object.scale.clone()
                });

                // Apply outline material
                object.material = this.outlineMaterial;

                // Scale up slightly for outline effect
                const scaleFactor = 1 + this.outlineThickness;
                object.scale.multiplyScalar(scaleFactor);
            }
        });

        // Render with outline material
        this.renderer.render(this.scene, this.camera);

        // Restore original materials and scales
        this.originalMaterials.forEach((data, object) => {
            object.material = data.material;
            object.scale.copy(data.scale);
        });

        this.originalMaterials.clear();
    }

    setThickness(thickness) {
        this.outlineThickness = thickness;
    }

    setColor(color) {
        this.outlineColor.set(color);
        this.outlineMaterial.color.set(color);
    }
}
