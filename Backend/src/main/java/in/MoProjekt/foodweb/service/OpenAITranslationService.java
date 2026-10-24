package in.MoProjekt.foodweb.service;

import java.util.Map;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OpenAITranslationService {

    // Sprachcodes, die die Website unterstützt
    public static final Map<String, String> LANGUAGES = Map.of(
            "de", "German",
            "en", "English",
            "ar", "Arabic");

    private final ChatClient chatClient;

    public String translate(String text, String targetLang) {

        String prompt = """
            Translate the following food name/description into %s.
            Make it natural, short, and suitable for a restaurant menu.
            Keep emojis or remove them if needed.
            Answer with the translated text only, without quotes or explanations.

            TEXT:
            %s
        """.formatted(targetLang, text);

        return chatClient
                .prompt()
                .user(prompt)
                .call()
                .content()
                .trim();
    }
}
