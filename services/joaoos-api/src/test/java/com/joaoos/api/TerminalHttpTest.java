package com.joaoos.api;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
@SpringBootTest @AutoConfigureMockMvc @ActiveProfiles("dev")
class TerminalHttpTest {
    @Autowired MockMvc mvc;
    @Test void commandRespondsAsJson() throws Exception { mvc.perform(post("/api/terminal").contentType("application/json").content("{\"command\":\"java --version\",\"language\":\"en\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.lines[0]").value("Java 21")); }
    @Test void rejectsBadBodies() throws Exception {
        for (String body : new String[]{"{}", "null", "{", "{\"command\":\"help\",\"language\":\"de\"}", "{\"command\":\"help\\n\"}", "{\"command\":\"" + "a".repeat(121) + "\"}"}) mvc.perform(post("/api/terminal").contentType("application/json").content(body)).andExpect(status().isBadRequest()).andExpect(jsonPath("$.lines").isArray());
    }
    @Test void refusesUnknownCommandAndOversizedBody() throws Exception {
        mvc.perform(post("/api/terminal").contentType("application/json").content("{\"command\":\"rm -rf /\"}")).andExpect(status().isBadRequest());
        mvc.perform(post("/api/terminal").contentType("application/json").content(" ".repeat(2049))).andExpect(status().isPayloadTooLarge());
    }
    @Test void restrictsCors() throws Exception {
        mvc.perform(options("/api/terminal").header("Origin", "http://localhost:3000").header("Access-Control-Request-Method", "POST")).andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
        mvc.perform(options("/api/terminal").header("Origin", "https://evil.example").header("Access-Control-Request-Method", "POST")).andExpect(status().isForbidden());
    }
}
