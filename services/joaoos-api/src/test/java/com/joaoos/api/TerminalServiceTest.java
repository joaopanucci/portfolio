package com.joaoos.api;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.assertj.core.api.Assertions.assertThat;
class TerminalServiceTest {
    private final TerminalService service = new TerminalService();
    @ParameterizedTest @ValueSource(strings = {"help", "about", "projects", "skills", "clear", "java --version", "whoami", "nyron"})
    void acceptsOnlyKnownCommands(String command) { assertThat(service.execute(command, "pt").status()).isEqualTo("ok"); }
    @ParameterizedTest @ValueSource(strings = {"ls", "help; whoami", "$(whoami)", "java --version && ls", "cat /etc/passwd", "HELP"})
    void rejectsShellAndUnknownCommands(String command) { assertThat(service.execute(command, "en").status()).isEqualTo("unknown"); }
    @Test void validatesBoundaries() {
        for (String command : new String[]{null, "", "   ", "x".repeat(121), "help\n", "help\u0000"}) assertThat(service.execute(command, "pt").status()).isEqualTo("invalid");
        assertThat(service.execute("x".repeat(120), "pt").status()).isEqualTo("unknown");
        assertThat(service.execute("  help  ", "pt").status()).isEqualTo("ok");
    }
    @Test void reportsActualJavaAndClear() {
        assertThat(service.execute("java --version", "en").lines().getFirst()).isEqualTo("Java 21");
        assertThat(service.execute("clear", "pt").lines()).isEmpty();
    }
    @Test void nyronRunsAClosedOrbit() {
        var lines = service.execute("nyron", "en").lines();
        assertThat(lines).hasSize(2);
        assertThat(lines.get(1)).contains("3650 ticks").contains("drift");
    }
    @Test void translatesAndFallsBack() {
        assertThat(service.execute("about", "es").lines().getFirst()).contains("portafolio");
        assertThat(service.execute("about", null).lines().getFirst()).contains("portfólio");
    }
}
