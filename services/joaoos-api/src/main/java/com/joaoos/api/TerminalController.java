package com.joaoos.api;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/terminal")
public class TerminalController {
    private final TerminalService service;
    public TerminalController(TerminalService service) { this.service = service; }
    public record CommandRequest(@NotBlank @Size(max = 120) @Pattern(regexp = "[^\\p{Cntrl}]+") String command,
                                 @Pattern(regexp = "pt|en|es") String language) {}
    @PostMapping
    public ResponseEntity<TerminalResponse> execute(@Valid @RequestBody CommandRequest request) {
        var result = service.execute(request.command(), request.language());
        return ResponseEntity.status(result.status().equals("ok") ? 200 : 400).body(result);
    }
}
