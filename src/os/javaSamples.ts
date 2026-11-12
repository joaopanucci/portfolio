export type JavaFile = { name: string; code: string };

export const javaFiles: JavaFile[] = [
  {
    name: "Engine.java",
    code: `package dev.nyron.core;

/** Fixed-timestep game loop: simulation stays deterministic at any frame rate. */
public final class Engine implements Runnable {
    private static final double STEP = 1.0 / 120.0;

    private final World world;
    private final Renderer renderer;
    private volatile boolean running = true;

    public Engine(World world, Renderer renderer) {
        this.world = world;
        this.renderer = renderer;
    }

    @Override
    public void run() {
        long previous = System.nanoTime();
        double accumulator = 0;

        while (running) {
            long now = System.nanoTime();
            accumulator += Math.min((now - previous) / 1e9, 0.25);
            previous = now;

            while (accumulator >= STEP) {
                world.update(STEP);          // systems run here
                accumulator -= STEP;
            }
            renderer.render(world, accumulator / STEP); // interpolate
        }
    }

    public void stop() { running = false; }
}`,
  },
  {
    name: "World.java",
    code: `package dev.nyron.core;

import java.util.ArrayList;
import java.util.List;

/** Holds entities and runs systems in a fixed order every tick. */
public final class World {
    private final List<Body> bodies = new ArrayList<>();
    private final List<GameSystem> systems = List.of(
        new GravitySystem(),
        new IntegrationSystem(),
        new CullingSystem()
    );

    public Body spawn(double x, double y, double vx, double vy) {
        var body = new Body(x, y, vx, vy);
        bodies.add(body);
        return body;
    }

    public void update(double dt) {
        for (GameSystem system : systems) {
            system.apply(bodies, dt);
        }
    }

    public List<Body> bodies() { return List.copyOf(bodies); }
}

/** A component bundle: position, velocity, acceleration. */
record Vec2(double x, double y) {
    Vec2 plus(Vec2 o)    { return new Vec2(x + o.x, y + o.y); }
    Vec2 times(double k) { return new Vec2(x * k, y * k); }
    double length()      { return Math.hypot(x, y); }
}`,
  },
  {
    name: "GravitySystem.java",
    code: `package dev.nyron.core;

import java.util.List;

/** Velocity-Verlet integration around a central star. */
final class GravitySystem implements GameSystem {
    private static final double GM = 1.0;
    private static final double SOFTENING = 0.012;

    @Override
    public void apply(List<Body> bodies, double dt) {
        for (Body b : bodies) {
            if (b.isFixed()) continue;

            // x += v*dt + a*dt²/2
            b.position = b.position
                .plus(b.velocity.times(dt))
                .plus(b.acceleration.times(0.5 * dt * dt));

            Vec2 previous = b.acceleration;
            b.acceleration = pull(b.position);

            // v += (a_old + a_new) * dt / 2
            b.velocity = b.velocity
                .plus(previous.plus(b.acceleration).times(0.5 * dt));
        }
    }

    private static Vec2 pull(Vec2 p) {
        double d2 = p.x() * p.x() + p.y() * p.y() + SOFTENING * SOFTENING;
        double inv = -GM / (d2 * Math.sqrt(d2));
        return new Vec2(p.x() * inv, p.y() * inv);
    }
}`,
  },
];

const KEYWORDS = new Set(
  "package import public private protected static final class record interface implements extends new return if else for while do switch case break continue this super void throws throw try catch finally volatile var default abstract".split(" "),
);
const TYPES = new Set(
  "String int long double float boolean byte char List ArrayList Math System Runnable Override Body World Engine Renderer Vec2 GameSystem GravitySystem IntegrationSystem CullingSystem".split(" "),
);

export type Token = { text: string; kind: "kw" | "type" | "str" | "num" | "com" | "ann" | "plain" };

export function tokenize(line: string): Token[] {
  const out: Token[] = [];
  const re = /(\/\/.*|\/\*\*.*?\*\/|\/\*.*|\*.*)|("(?:[^"\\]|\\.)*")|(@\w+)|(\b\d[\d_.eE]*\b)|([A-Za-z_]\w*)|(\s+|.)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    if (m[1]) out.push({ text: m[1], kind: "com" });
    else if (m[2]) out.push({ text: m[2], kind: "str" });
    else if (m[3]) out.push({ text: m[3], kind: "ann" });
    else if (m[4]) out.push({ text: m[4], kind: "num" });
    else if (m[5])
      out.push({ text: m[5], kind: KEYWORDS.has(m[5]) ? "kw" : TYPES.has(m[5]) ? "type" : "plain" });
    else out.push({ text: m[6], kind: "plain" });
  }
  return out;
}
