package com.locninh.smiletofast.config;

import com.zaxxer.hikari.HikariDataSource;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

@Configuration
public class SmileDataSourceConfig {

    @Bean(name = "smileDataSource")
    @ConfigurationProperties(
            prefix = "smile.datasource"
    )
    public DataSource smileDataSource() {

        return DataSourceBuilder
                .create()
                .type(HikariDataSource.class)
                .build();
    }


    @Bean(name = "smileJdbcTemplate")
    public JdbcTemplate smileJdbcTemplate(
            @Qualifier("smileDataSource")
            DataSource dataSource
    ) {

        return new JdbcTemplate(
                dataSource
        );
    }
}