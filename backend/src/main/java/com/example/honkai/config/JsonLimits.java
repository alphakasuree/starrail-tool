package com.example.honkai.config;
import org.springframework.context.annotation.*;
import org.springframework.boot.autoconfigure.jackson.Jackson2ObjectMapperBuilderCustomizer;
import com.fasterxml.jackson.core.StreamReadConstraints;
@Configuration
public class JsonLimits {
    @Bean Jackson2ObjectMapperBuilderCustomizer customizeJsonLimits() {
        return builder->builder.postConfigurer(mapper->mapper.getFactory().setStreamReadConstraints(
            StreamReadConstraints.builder().maxNestingDepth(20).maxStringLength(65536).maxDocumentLength(524288).build()));
    }
}
