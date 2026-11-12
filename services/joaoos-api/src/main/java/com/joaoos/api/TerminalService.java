package com.joaoos.api;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.stereotype.Service;
@Service
public class TerminalService {
    public static final Set<String> ALLOWED = Set.of("help", "about", "projects", "skills", "clear", "java --version", "whoami", "nyron");
    private static final Map<String, Map<String, String>> TEXT = Map.of(
        "pt", Map.of("about", "JoãoOS — portfólio interativo de João Panucci.", "unknown", "Comando não permitido. Digite help.", "invalid", "Entrada inválida: use de 1 a 120 caracteres em uma linha."),
        "en", Map.of("about", "JoãoOS — João Panucci’s interactive portfolio.", "unknown", "Command not allowed. Type help.", "invalid", "Invalid input: use 1 to 120 characters on one line."),
        "es", Map.of("about", "JoãoOS — portafolio interactivo de João Panucci.", "unknown", "Comando no permitido. Escribe help.", "invalid", "Entrada inválida: usa de 1 a 120 caracteres en una línea.")
    );
    public TerminalResponse execute(String input, String language) {
        var text = TEXT.getOrDefault(language == null ? "pt" : language, TEXT.get("pt"));
        if (input == null || input.isBlank() || input.length() > 120 || input.chars().anyMatch(Character::isISOControl)) {
            return new TerminalResponse("", "invalid", List.of(text.get("invalid")));
        }
        String command = input.strip();
        if (!ALLOWED.contains(command)) return new TerminalResponse(command, "unknown", List.of(text.get("unknown")));
        var lines = switch (command) {
            case "help" -> List.of("help · about · projects · skills · nyron · java --version · whoami · clear");
            case "about" -> List.of(text.get("about"));
            case "projects" -> List.of("Dakiali — https://dakiali.com", "JELCH Group — https://jelchgroup.com", "AutoDock — https://github.com/joaopanucci/autodock", "Nyron Engine · Java", "SAPS", "Acho");
            case "skills" -> List.of("Java · Spring Boot · TypeScript · React · Docker · PostgreSQL");
            case "nyron" -> NyronDemo.run(language);
            case "clear" -> List.<String>of();
            case "java --version" -> List.of("Java " + Runtime.version().feature(), System.getProperty("java.runtime.name") + " " + System.getProperty("java.runtime.version"));
            case "whoami" -> List.of("João Panucci", "https://github.com/joaopanucci");
            default -> throw new IllegalStateException("Unmapped allowlisted command");
        };
        return new TerminalResponse(command, "ok", lines);
    }
}
