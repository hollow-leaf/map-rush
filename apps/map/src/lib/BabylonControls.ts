import { Scene, AbstractMesh, ActionManager, ExecuteCodeAction, Vector3, Quaternion, Matrix } from '@babylonjs/core';

export class BabylonControls {
    private scene: Scene;
    private carModel: AbstractMesh | null = null;
    private obstacles: AbstractMesh[] = []; // To check for collisions
    private cameraUpdater: () => void; // Callback to update camera position after movement

    private inputMap: any = {};
    private currentSpeed = 0;
    private readonly normalSpeed = 0.05;
    private readonly sprintSpeed = 0.1;
    private readonly rotationSpeed = 0.03; // Radians per frame

    public onCarMoved: ((position: Vector3, isSprinting: boolean) => void) | null = null;

    constructor(scene: Scene, cameraUpdater: () => void) {
        this.scene = scene;
        this.cameraUpdater = cameraUpdater;
    }

    public setCarModel(model: AbstractMesh): void {
        this.carModel = model;
        // Ensure rotationQuaternion is initialized for the car model
        if (this.carModel && !this.carModel.rotationQuaternion) {
            this.carModel.rotationQuaternion = Quaternion.FromEulerVector(this.carModel.rotation);
        }
    }

    public setObstacles(obstacles: AbstractMesh[]): void {
        this.obstacles = obstacles;
    }

    public setupKeyboardControls(): void {
        if (!this.scene) return;

        if (!this.scene) {
            // console.error("BabylonControls: Scene is not available for setting up keyboard controls.");
            return;
        }
        this.scene.actionManager = new ActionManager(this.scene);
        if (!this.scene.actionManager) {
            // console.error("BabylonControls: ActionManager creation failed.");
            return;
        }

        this.scene.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnKeyDownTrigger, (evt) => {
                const key = evt.sourceEvent.key.toLowerCase();
                this.inputMap[key] = true;
            })
        );
        this.scene.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnKeyUpTrigger, (evt) => {
                const key = evt.sourceEvent.key.toLowerCase();
                this.inputMap[key] = false;
            })
        );
        // console.log("BabylonControls: Keyboard listeners registered.");

        this.scene.onBeforeRenderObservable.add(() => {
            if (!this.carModel) return;

            const previousPosition = this.carModel.position.clone();
            if (!this.carModel.rotationQuaternion) {
                this.carModel.rotationQuaternion = Quaternion.FromEulerVector(this.carModel.rotation);
            }
            const previousRotation = this.carModel.rotationQuaternion.clone();

            let isSprinting = false;
            if (this.inputMap["shift"]) { 
                this.currentSpeed = this.sprintSpeed;
                isSprinting = true;
            } else {
                this.currentSpeed = this.normalSpeed;
            }
            
            let moved = false;
            let rotated = false;

            if (this.inputMap["arrowup"] || this.inputMap["w"]) {
                this._move('forward', this.currentSpeed);
                moved = true;
            }
            if (this.inputMap["arrowdown"] || this.inputMap["s"]) {
                this._move('backward', this.currentSpeed * 0.7); 
                moved = true;
            }

            if (this.inputMap["arrowleft"] || this.inputMap["a"]) {
                this._rotate('left');
                rotated = true;
            }
            if (this.inputMap["arrowright"] || this.inputMap["d"]) {
                this._rotate('right');
                rotated = true;
            }
            
            const actionPerformed = moved || rotated;

            if (actionPerformed) {
                this.carModel.computeWorldMatrix(true);
                let collisionDetected = false;
                if (moved) { 
                    const carBoundingBox = this.carModel.getBoundingInfo().boundingBox;
                    for (const obstacle of this.obstacles) {
                        if (obstacle.isEnabled() && carBoundingBox.intersects(obstacle.getBoundingInfo().boundingBox)) {
                            // console.log("BabylonControls: Collision detected with obstacle:", obstacle.name);
                            collisionDetected = true;
                            break;
                        }
                    }
                }

                if (collisionDetected) {
                    this.carModel.position = previousPosition;
                    this.carModel.rotationQuaternion = previousRotation;
                    this.carModel.computeWorldMatrix(true); 
                } else {
                    this.cameraUpdater(); 
                    if (this.onCarMoved) {
                        this.onCarMoved(this.carModel.getAbsolutePosition(), isSprinting);
                    }
                }
            }
        });
        // console.log("BabylonControls: onBeforeRenderObservable callback added for input processing.");
    }

    private _move(direction: 'forward' | 'backward', speed: number): void {
        if (!this.carModel || !this.carModel.rotationQuaternion) {
            return;
        }

        const moveVector = direction === 'forward' ? new Vector3(0, 0, 1) : new Vector3(0, 0, -1); 
        const worldMoveVector = Vector3.Zero();
        
        this.carModel.rotationQuaternion.toRotationMatrix(Matrix.IdentityReadOnly).transformCoordinates(moveVector, worldMoveVector);
        
        this.carModel.position.addInPlace(worldMoveVector.normalize().scaleInPlace(speed)); 
    }

    private _rotate(direction: 'left' | 'right'): void {
        if (!this.carModel || !this.carModel.rotationQuaternion) {
            return;
        }
        
        const rotationAngle = direction === 'left' ? -this.rotationSpeed : this.rotationSpeed;
        const rotationQuaternion = Quaternion.FromAxisAngle(Vector3.UpReadOnly, rotationAngle); 
        this.carModel.rotationQuaternion = rotationQuaternion.multiply(this.carModel.rotationQuaternion);
    }

    public triggerMovement(direction: 'forward' | 'backward', isSprinting: boolean = false): void {
        if (!this.carModel) return;

        const speedToUse = isSprinting ? this.sprintSpeed : this.normalSpeed;
        const effectiveSpeed = direction === 'forward' ? speedToUse : speedToUse * 0.7; // Slower reverse

        if (!this.carModel.rotationQuaternion) {
            this.carModel.rotationQuaternion = Quaternion.FromEulerVector(this.carModel.rotation);
        }

        const previousPosition = this.carModel.position.clone();
        this._move(direction, effectiveSpeed);

        this.carModel.computeWorldMatrix(true);
        let collisionDetected = false;
        const carBoundingBox = this.carModel.getBoundingInfo().boundingBox;
        for (const obstacle of this.obstacles) {
            if (obstacle.isEnabled() && carBoundingBox.intersects(obstacle.getBoundingInfo().boundingBox)) {
                collisionDetected = true;
                break;
            }
        }

        if (collisionDetected) {
            this.carModel.position = previousPosition;
            this.carModel.computeWorldMatrix(true);
        } else {
            this.cameraUpdater();
            if (this.onCarMoved) {
                this.onCarMoved(this.carModel.getAbsolutePosition(), isSprinting);
            }
        }
    }

    public triggerRotation(direction: 'left' | 'right'): void {
        if (!this.carModel) return;

        if (!this.carModel.rotationQuaternion) {
            this.carModel.rotationQuaternion = Quaternion.FromEulerVector(this.carModel.rotation);
        }
        
        // No collision check for rotation in the original logic, maintaining that here.
        // If collision on rotation is desired, it would be added similarly to triggerMovement.
        this._rotate(direction);

        this.cameraUpdater();
        if (this.onCarMoved) {
            this.onCarMoved(this.carModel.getAbsolutePosition(), false); // isSprinting is false for rotation
        }
    }
}
