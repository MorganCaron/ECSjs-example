function degtorad(degres) {
    return (degres * (2 * Math.PI) / 360);
}
function radtodeg(radians) {
    return (radians * 360 / (2 * Math.PI));
}

function pointDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2-x1, 2) + Math.pow(y2-y1, 2));
}
function pointDirection(x1, y1, x2, y2) {
    return Math.atan2(y2-y1, x2-x1);
}

class CanvasComponent {
    constructor() {
        this.element = null;
        this.context = null;
        this.mouseX = 0;
        this.mouseY = 0;
    }

    init(id) {
        this.element = document.getElementById(id);
        this.context = this.element.getContext('2d');
    }

    updateMousePos(element, evt) {
        var rect = element.getBoundingClientRect();
        this.mouseX = evt.clientX - rect.left,
        this.mouseY = evt.clientY - rect.top
    }
}

class Position2dComponent {
    constructor() {
        this.x = 0;
        this.y = 0;
    }

    set(x, y) {
        this.x = x;
        this.y = y;
    }

    add(x, y) {
        this.x += x;
        this.y += y;
    }
}

class Velocity2dComponent {
    constructor() {
        this.vx = 0;
        this.vy = 0;
        this.friction = 0;
    }

    set(vx, vy) {
        this.vx = vx;
        this.vy = vy;
    }

    add(vx, vy) {
        this.vx += vx;
        this.vy += vy;
    }

    mul(vx, vy) {
        this.vx *= vx;
        this.vy *= vy;
    }
}

class Gravity2dComponent {
    constructor() {
        this.gravity = 0;
        this.gravityDirection = 0;
    }

    init(gravity, gravityDirection) {
        this.gravity = gravity;
        this.gravityDirection = gravityDirection;
    }
}

class CircleComponent {
    constructor() {
        this.radius = 0;
        this.color = 'black';
    }

    init(radius, color) {
        this.radius = radius;
        this.color = color;
    }
}

class CanvasSystem {
    update(entities) {
        var canvasEntities = entities.queryComponent(CanvasComponent);
        canvasEntities.forEach(function(canvas) {
            canvas.canvasComponent.context.clearRect(0, 0, 600, 400);
        });
    }
}

class Velocity2dSystem {
    update(entities) {
        var velocity2dEntities = entities.queryComponents([Velocity2dComponent]);
        velocity2dEntities.forEach(function(entity) {
            entity.position2dComponent.add(entity.velocity2dComponent.vx, entity.velocity2dComponent.vy);
        });
    }
}

class Gravity2dSystem {
    update(entities) {
        var gravity2dEntities = entities.queryComponent(Gravity2dComponent);
        gravity2dEntities.forEach(function(entity) {
            entity.velocity2dComponent.mul(entity.velocity2dComponent.friction, entity.velocity2dComponent.friction);
            entity.velocity2dComponent.vx += Math.cos(degtorad(entity.gravity2dComponent.gravityDirection)) * entity.gravity2dComponent.gravity;
            entity.velocity2dComponent.vy += Math.sin(degtorad(entity.gravity2dComponent.gravityDirection)) * entity.gravity2dComponent.gravity;
        });
    }
}

class CircleSystem {
    update(entities) {
        var canvasEntities = entities.queryComponent(CanvasComponent);
        var circleEntities = entities.queryComponent(CircleComponent);
        canvasEntities.forEach(function(canvas) {
            circleEntities.forEach(function(circle) {
                canvas.canvasComponent.context.beginPath();
                canvas.canvasComponent.context.moveTo(circle.position2dComponent.x, circle.position2dComponent.y - circle.circleComponent.radius);
                for (var i = 0; i <= 360; i += 10)
                    canvas.canvasComponent.context.lineTo(circle.position2dComponent.x + Math.cos(degtorad(i)) * circle.circleComponent.radius, circle.position2dComponent.y - Math.sin(degtorad(i)) * circle.circleComponent.radius);
                canvas.canvasComponent.context.closePath();
                canvas.canvasComponent.context.fillStyle = circle.circleComponent.color;
                canvas.canvasComponent.context.lineCap = 'round';
                canvas.canvasComponent.context.fill();
            });
        });
    }
}

class CollisionSystem {
    update(entities) {
        var circleEntities = entities.queryComponent(CircleComponent);
        circleEntities.forEach(function(circle) {
            if (circle.position2dComponent.x <= circle.circleComponent.radius && circle.velocity2dComponent.vx < 0) {
                circle.position2dComponent.x = circle.circleComponent.radius;
                circle.velocity2dComponent.vx *= -1;
            }
            if (circle.position2dComponent.y <= circle.circleComponent.radius && circle.velocity2dComponent.vy < 0) {
                circle.position2dComponent.y = circle.circleComponent.radius;
                circle.velocity2dComponent.vy *= -1;
            }
            if (circle.position2dComponent.x >= 600-circle.circleComponent.radius && circle.velocity2dComponent.vx > 0) {
                circle.position2dComponent.x = 600-circle.circleComponent.radius;
                circle.velocity2dComponent.vx *= -1;
            }
            if (circle.position2dComponent.y >= 400-circle.circleComponent.radius && circle.velocity2dComponent.vy > 0) {
                circle.position2dComponent.y = 400-circle.circleComponent.radius;
                circle.velocity2dComponent.vy *= -1;
            }

            circleEntities.forEach(function(other) {
                var distance = pointDistance(circle.position2dComponent.x, circle.position2dComponent.y, other.position2dComponent.x, other.position2dComponent.y);
                if (distance > 0) {
                    var direction = pointDirection(circle.position2dComponent.x, circle.position2dComponent.y, other.position2dComponent.x, other.position2dComponent.y);
                    var padding = (circle.circleComponent.radius + other.circleComponent.radius) - distance;
                    if (padding > 0) {
                        circle.position2dComponent.add(-Math.cos(direction), -Math.sin(direction));
                        circle.velocity2dComponent.mul(-Math.cos(direction), -Math.sin(direction));
                    }
                }
            });
        });
    }
}

class FollowMouseSystem {
    update(entities) {
        var followMouseEntities = entities.queryTag('followMouse');
    }
}

class App {
    constructor() {
        this.ecs = new ECS();

        this.ecs.addSystems([
            CanvasSystem,
            Velocity2dSystem,
            Gravity2dSystem,
            CollisionSystem,
            CircleSystem
        ]);

        var canvas = this.ecs.entities.createEntity();
        canvas.addComponent(CanvasComponent);
        canvas.canvasComponent.init('canvas');
        canvas.canvasComponent.element.addEventListener('mousemove', function(evt) {
            canvas.canvasComponent.updateMousePos(this, evt);
        }, false);

        for (var i = 0; i < 20; i++) {
            var circle = this.ecs.entities.createEntity();
            circle.addComponents([Position2dComponent, Velocity2dComponent, CircleComponent, Gravity2dComponent]);
            circle.position2dComponent.set(50 + (i % 10) * 50, 50 + Math.floor(i / 10) * 50);
            circle.velocity2dComponent.set(Math.random() - .5, 0);
            circle.velocity2dComponent.friction = .99;
            circle.circleComponent.init(20, 'red');
            circle.gravity2dComponent.init(.09807, 90);
        }
    }

    update() {
        this.ecs.update();
    }
}

var app;
document.addEventListener('DOMContentLoaded', function() {
    app = new App();
    requestAnimationFrame(update);
}, false);
function update() {
    app.update();
    requestAnimationFrame(update);
};
