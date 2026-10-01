FROM maven:3.9.11-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -B -ntp package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
RUN groupadd --system honkai && useradd --system --gid honkai honkai
COPY --from=build --chown=honkai:honkai /app/target/honkai-backend-0.1.0.jar ./app.jar
USER honkai
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
