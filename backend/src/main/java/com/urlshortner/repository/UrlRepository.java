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

    List<Url> findByUserOrderByCreatedAtDesc(User user);

    long countByUser(User user);

    @Modifying
    @Query("UPDATE Url u SET u.clickCount = u.clickCount + 1 WHERE u.id = :id")
    void incrementClickCount(@Param("id") String id);

    @Query("SELECT COALESCE(SUM(u.clickCount), 0) FROM Url u WHERE u.user = :user")
    long sumClickCountByUser(@Param("user") User user);

    @Query("SELECT COALESCE(SUM(u.clickCount), 0) FROM Url u")
    long sumClickCount();
}
