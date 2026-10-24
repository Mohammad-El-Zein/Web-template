package in.MoProjekt.foodweb.service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

// Einfaches Limit pro Stunde (im Speicher), damit niemand die OpenAI-Kosten in die Höhe treibt
@Component
public class RateLimiter {

    private static final long WINDOW_MILLIS = 60 * 60 * 1000;

    @Value("${nutrition.rate-limit.per-ip}")
    private int limitPerClient;

    @Value("${nutrition.rate-limit.global}")
    private int globalLimit;

    private final Map<String, AtomicInteger> counters = new ConcurrentHashMap<>();
    private final AtomicInteger globalCounter = new AtomicInteger();
    private long windowStart = System.currentTimeMillis();

    public synchronized boolean tryAcquire(String clientKey) {
        long now = System.currentTimeMillis();
        if (now - windowStart >= WINDOW_MILLIS) {
            counters.clear();
            globalCounter.set(0);
            windowStart = now;
        }
        if (globalCounter.get() >= globalLimit) {
            return false;
        }
        AtomicInteger counter = counters.computeIfAbsent(clientKey, key -> new AtomicInteger());
        if (counter.get() >= limitPerClient) {
            return false;
        }
        counter.incrementAndGet();
        globalCounter.incrementAndGet();
        return true;
    }
}
