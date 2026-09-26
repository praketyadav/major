package com.recruitr.gateway.filter;

import com.recruitr.gateway.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private final JwtUtil jwtUtil;

    // These paths do NOT require a JWT token
    private static final List<String> PUBLIC_PATHS = List.of(
            "/api/v1/auth/login"
    );

    // These paths accept a token if present but don't require it
    private static final List<String> OPTIONAL_AUTH_PATHS = List.of(
            "/api/v1/auth/register"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();

        // Truly public — no token needed
        if (PUBLIC_PATHS.stream().anyMatch(path::startsWith)) {
            return chain.filter(exchange);
        }

        String authHeader = request.getHeaders()
                .getFirst(HttpHeaders.AUTHORIZATION);

        // Optional auth paths — add headers if token present,
        // allow through either way
        if (OPTIONAL_AUTH_PATHS.stream().anyMatch(path::startsWith)) {
            if (authHeader != null
                    && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                if (jwtUtil.isTokenValid(token)) {
                    String userId = jwtUtil.extractUserId(token);
                    String role = jwtUtil.extractRole(token);
                    ServerHttpRequest modifiedRequest = request.mutate()
                            .header("X-User-Id", userId)
                            .header("X-User-Role", role)
                            .build();
                    return chain.filter(
                            exchange.mutate()
                                    .request(modifiedRequest).build());
                }
            }
            return chain.filter(exchange);
        }

        // All other paths — token required
        if (authHeader == null
                || !authHeader.startsWith("Bearer ")) {
            return sendUnauthorized(exchange,
                    "Missing or invalid Authorization header");
        }

        String token = authHeader.substring(7);

        if (!jwtUtil.isTokenValid(token)) {
            return sendUnauthorized(exchange,
                    "Invalid or expired JWT token");
        }

        // Extract user info from token and add as headers
        // These headers are then read by each microservice
        String userId = jwtUtil.extractUserId(token);
        String role = jwtUtil.extractRole(token);

        ServerHttpRequest modifiedRequest = request.mutate()
                .header("X-User-Id", userId)
                .header("X-User-Role", role)
                .build();

        return chain.filter(exchange.mutate().request(modifiedRequest).build());
    }

    private Mono<Void> sendUnauthorized(ServerWebExchange exchange, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().add("Content-Type", "application/json");
        var buffer = response.bufferFactory()
                .wrap(("{\"error\": \"" + message + "\"}").getBytes());
        return response.writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        // Run this filter before all other filters
        return -1;
    }
}
