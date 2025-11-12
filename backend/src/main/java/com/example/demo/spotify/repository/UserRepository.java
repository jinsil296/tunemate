package com.example.demo.spotify.repository;

import java.util.Optional;

import org.apache.ibatis.annotations.Mapper;
import org.springframework.stereotype.Repository;

import com.example.demo.spotify.model.User;

@Mapper
@Repository
public interface UserRepository {

    Optional<User> findBySpotifyId(String spotifyId);

    void save(User user);

    void updateToken(User user);

}
