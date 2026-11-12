package com.joaoos.api;
import java.util.List;
public record TerminalResponse(String command, String status, List<String> lines) {}
