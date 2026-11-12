package com.joaoos.api;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
@RestControllerAdvice
public class ApiErrors {
    @ExceptionHandler({MethodArgumentNotValidException.class, HttpMessageNotReadableException.class})
    public ResponseEntity<TerminalResponse> invalid(Exception ignored) { return error(400, "Invalid request / Requisição inválida / Solicitud inválida."); }
    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<TerminalResponse> media(Exception ignored) { return error(415, "Use application/json."); }
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<TerminalResponse> method(Exception ignored) { return error(405, "Use POST."); }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<TerminalResponse> unexpected(Exception ignored) { return error(500, "Service error / Erro no serviço / Error del servicio."); }
    private ResponseEntity<TerminalResponse> error(int status, String text) { return ResponseEntity.status(status).body(new TerminalResponse("", "error", List.of(text))); }
}
