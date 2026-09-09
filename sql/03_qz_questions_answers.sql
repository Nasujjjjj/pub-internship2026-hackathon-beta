-- QZ_QUESTIONS / QZ_ANSWERS テーブル定義
USE WAREHOUSE TEAM_B_WH;

CREATE OR REPLACE TABLE TEAM_B_DB.DEVELOPMENT.QZ_QUESTIONS (
    ID              NUMBER AUTOINCREMENT PRIMARY KEY,
    DECK            VARCHAR NOT NULL,        -- 'category','state','month','segment','weather'
    QTYPE           VARCHAR NOT NULL,        -- 'highlow' or 'blank'
    QUESTION_TEXT   VARCHAR NOT NULL,
    ITEM_A          VARCHAR,                 -- High&Low: ラベル A
    ITEM_B          VARCHAR,                 -- High&Low: ラベル B
    METRIC          VARCHAR,                 -- e.g. 'sales','aov','orders'
    VALUE_A         NUMBER(38,2),
    VALUE_B         NUMBER(38,2),
    SERIES          VARIANT,                 -- 虫食いグラフ: 時系列 JSON
    MASK_FROM       NUMBER,                  -- 虫食い: 隠す範囲の開始インデックス
    MASK_TO         NUMBER,                  -- 虫食い: 隠す範囲の終了インデックス
    CHOICES         VARIANT,                 -- 虫食い: 4 択の系列
    CORRECT         NUMBER,                  -- 正解 (0=A が上 / 1=B が上, 虫食いは 0-3)
    EXPLANATION     VARCHAR,
    SQL_TEXT        VARCHAR,                 -- 正解導出に使った SQL
    AI_GENERATED    BOOLEAN DEFAULT FALSE,
    CREATED_AT      TIMESTAMP_LTZ DEFAULT CURRENT_TIMESTAMP()
);

CREATE OR REPLACE TABLE TEAM_B_DB.DEVELOPMENT.QZ_ANSWERS (
    ANSWERED_AT   TIMESTAMP_LTZ DEFAULT CURRENT_TIMESTAMP(),
    PLAYER        VARCHAR,
    QUESTION_ID   NUMBER REFERENCES TEAM_B_DB.DEVELOPMENT.QZ_QUESTIONS(ID),
    CHOSEN        NUMBER,
    IS_CORRECT    BOOLEAN
);
