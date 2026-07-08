# --- Stage 1: bauen mit maven ---
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# --- Stage 2: nur das fertige jar ausfuehren ---
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# render setzt PORT automatisch, spring.boot hoert per default auf 8080
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]