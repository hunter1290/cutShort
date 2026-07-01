package com.urlshortner.repository;

import com.urlshortner.entity.Url;
import com.urlshortner.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UrlRepository extends JpaRepository<Url, String> {

    Optional<Url> findByShortCodeAndActiveTrue(String shortCode);

    Optional<Url> findByShortCodeAndUser(String shortCode, User user);

    boolean existsByShortCode(String shortCode);

    List<Url> findByUserAndActiveTrueOrderByCreatedAtDesc(User user);

    @Modifying
    @Query("UPDATE Url u SET u.clickCount = u.clickCount + 1 WHERE u.id = :id")
    void incrementClickCount(@Param("id") String id);
}
