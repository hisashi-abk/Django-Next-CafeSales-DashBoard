-- 外部キー制約を無効化
SET foreign_key_checks = 0;

-- データベース作成
CREATE DATABASE IF NOT EXISTS cafe_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE cafe_db;

-- カテゴリーテーブル
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY,
    name VARCHAR(50) NOT NULL
) ENGINE=InnoDB;

-- 性別テーブル
CREATE TABLE IF NOT EXISTS genders (
    id INT PRIMARY KEY,
    name VARCHAR(10) NOT NULL
) ENGINE=InnoDB;

-- 注文タイプテーブル
CREATE TABLE IF NOT EXISTS order_types (
    id INT PRIMARY KEY,
    name VARCHAR(20) NOT NULL
) ENGINE=InnoDB;

-- 天気タイプテーブル
CREATE TABLE IF NOT EXISTS weather_types (
    id INT PRIMARY KEY,
    name VARCHAR(20) NOT NULL
) ENGINE=InnoDB;

-- 時間帯テーブル
CREATE TABLE IF NOT EXISTS time_slots (
    id INT PRIMARY KEY,
    name VARCHAR(20) NOT NULL
) ENGINE=InnoDB;

-- メニューアイテムテーブル
CREATE TABLE IF NOT EXISTS menu_items (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price INT NOT NULL,
    category_id INT NOT NULL,
    FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB;

-- 注文テーブル
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    timestamp DATETIME NOT NULL,
    gender_id INT NOT NULL,
    order_type_id INT NOT NULL,
    weather_id INT NOT NULL,
    time_slot_id INT NOT NULL,
    total_price INT NOT NULL,
    discount INT NOT NULL,
    FOREIGN KEY (gender_id) REFERENCES genders(id),
    FOREIGN KEY (order_type_id) REFERENCES order_types(id),
    FOREIGN KEY (weather_id) REFERENCES weather_types(id),
    FOREIGN KEY (time_slot_id) REFERENCES time_slots(id)
) ENGINE=InnoDB;

-- 注文アイテムテーブル
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    menu_item_id INT NOT NULL,
    price INT NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id)
) ENGINE=InnoDB;

-- 外部キー制約を有効化
SET foreign_key_checks = 1;
