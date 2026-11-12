package com.joaoos.api;

import java.util.List;
import java.util.Locale;

/**
 * Miniatura do laço de simulação de uma game engine: passo fixo, integração
 * velocity-Verlet e um único corpo orbitando uma estrela. É determinístico e
 * roda de verdade na JVM — apenas o tempo de execução varia.
 */
final class NyronDemo {
    private static final double GM = 4 * Math.PI * Math.PI; // unidades: UA e anos
    private static final int STEPS_PER_YEAR = 3650;

    private NyronDemo() {}

    static List<String> run(String language) {
        double x = 1.0, y = 0.0, vx = 0.0, vy = 2 * Math.PI;
        double dt = 1.0 / STEPS_PER_YEAR;
        double[] a = gravity(x, y);
        double minR = Double.MAX_VALUE, maxR = 0;
        long start = System.nanoTime();
        for (int i = 0; i < STEPS_PER_YEAR; i++) {
            x += vx * dt + 0.5 * a[0] * dt * dt;
            y += vy * dt + 0.5 * a[1] * dt * dt;
            double[] next = gravity(x, y);
            vx += 0.5 * (a[0] + next[0]) * dt;
            vy += 0.5 * (a[1] + next[1]) * dt;
            a = next;
            double r = Math.hypot(x, y);
            minR = Math.min(minR, r);
            maxR = Math.max(maxR, r);
        }
        long micros = (System.nanoTime() - start) / 1_000;
        double drift = Math.abs(Math.hypot(x, y) - 1.0);
        return switch (language == null ? "pt" : language) {
            case "en" -> lines("Nyron tick loop · velocity-Verlet, fixed timestep", "1 orbit = %d ticks · radius %.6f–%.6f AU · drift %.2e AU · %d µs on the JVM", minR, maxR, drift, micros);
            case "es" -> lines("Nyron tick loop · velocity-Verlet, paso fijo", "1 órbita = %d ticks · radio %.6f–%.6f UA · deriva %.2e UA · %d µs en la JVM", minR, maxR, drift, micros);
            default -> lines("Nyron tick loop · velocity-Verlet, passo fixo", "1 órbita = %d ticks · raio %.6f–%.6f UA · deriva %.2e UA · %d µs na JVM", minR, maxR, drift, micros);
        };
    }

    private static List<String> lines(String title, String format, double minR, double maxR, double drift, long micros) {
        return List.of(title, String.format(Locale.ROOT, format, STEPS_PER_YEAR, minR, maxR, drift, micros));
    }

    private static double[] gravity(double x, double y) {
        double r2 = x * x + y * y;
        double inv = -GM / (r2 * Math.sqrt(r2));
        return new double[] {x * inv, y * inv};
    }
}
