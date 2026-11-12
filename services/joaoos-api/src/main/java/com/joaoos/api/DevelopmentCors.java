package com.joaoos.api;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
@Configuration
@Profile("dev")
public class DevelopmentCors implements WebMvcConfigurer {
    @Value("${joaoos.cors.origins:http://localhost:3000,http://127.0.0.1:3000}")
    private String[] origins;
    @Override public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/terminal").allowedOrigins(origins)
            .allowedMethods("POST").allowedHeaders("Content-Type").allowCredentials(false).maxAge(600);
    }
}
