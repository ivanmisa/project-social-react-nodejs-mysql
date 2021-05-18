CREATE DATABASE db_links;

USE db_links;

-- Table User
--all password wil be encrypted using SHA1

CREATE TABLE users (
    id INT(11) NOT NULL,
    name VARCHAR(16) NOT NULL,
    hashed_password VARCHAR(210) NOT NULL,
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(30) NOT NULL,
    created timestamp NOT NULL DEFAULT current_timestamp,
    salt TEXT NOT NULL
);

ALTER TABLE users
    ADD PRIMARY KEY (id);

ALTER TABLE users
    MODIFY id INT(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT = 2;

DESCRIBE users;

INSERT INTO users(id, username, password, fullname)
    VALUES(1, 'jhon', 'password1', 'Jhon Carter');


-- LINK TABLE
CREATE TABLE post(
    id INT(11) NOT NULL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    photo TEXT NOT NULL,
    user_id INT(11) NOT NULL,
    created_at timestamp NOT NULL DEFAULT current_timestamp,
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id)
); 

ALTER TABLE post
    MODIFY id INT(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT = 2;

    DESCRIBE post;


CREATE TABLE follow(
    id INT(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    following_id INT(11) NOT NULL,
    followers_id INT(11) NOT NULL,
    CONSTRAINT fk_following FOREIGN KEY(following_id) REFERENCES users(id),
    CONSTRAINT fk_followers FOREIGN KEY(followers_id) REFERENCES users(id)
);

    DESCRIBE follow;


CREATE TABLE likes(
    id INT(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    post_id INT(11) NOT NULL,
    likedBy INT(11) NOT NULL,
    CONSTRAINT fk_postid FOREIGN KEY(post_id) REFERENCES post(id),
    CONSTRAINT fk_liked FOREIGN KEY(likedBy) REFERENCES users(id)
);

DESCRIBE likes;

CREATE TABLE comment(
    id INT(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    text VARCHAR(200) NOT NULL,
    commentBy INT(11) NOT NULL,
    fromPost INT(11) NOT NULL,
    CONSTRAINT fk_userComment FOREIGN KEY(commentBy) REFERENCES users(id),
    CONSTRAINT fk_postComment FOREIGN KEY(fromPost) REFERENCES post(id)
);

DESCRIBE comment;