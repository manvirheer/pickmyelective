package com.example.demo;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {

	public static void main(String[] args) {
		// Load .env file and set as system properties before Spring initializes
		Dotenv dotenv = Dotenv.configure()
				.ignoreIfMissing()
				.load();

		// Set database properties
		setPropertyIfExists(dotenv, "SUPABASE_DB_URL");
		setPropertyIfExists(dotenv, "SUPABASE_DB_USERNAME");
		setPropertyIfExists(dotenv, "SUPABASE_DB_PASSWORD");
		setPropertyIfExists(dotenv, "JWT_SECRET");
		setPropertyIfExists(dotenv, "RESEND_API_KEY");

		SpringApplication.run(Application.class, args);
	}

	private static void setPropertyIfExists(Dotenv dotenv, String key) {
		String value = dotenv.get(key);
		if (value != null) {
			System.setProperty(key, value);
		}
	}
}
