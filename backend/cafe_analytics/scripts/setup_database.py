import mysql.connector
from mysql.connector import Error
from dotenv import load_dotenv
import os
load_dotenv()

def setup_database():
    try:
        # データベース接続設定
        connection = mysql.connector.connect(
            host=os.getenv('MYSQL_DB_HOST'),
            user=os.getenv('MYSQL_DB_USER'),  # MySQLのユーザー名
            password=os.getenv('MYSQL_DB_PASSWORD'),  # MySQLのパスワード
        )

        if connection.is_connected():
            cursor = connection.cursor()

            # SQLファイルを取り込む
            with open("setup.sql", "r", encoding="utf-8") as file:
                sql_commands = file.read()

            # 複数のSQLコマンドを実行
            for command in sql_commands.split(";"):
                if command.strip():
                    cursor.execute(command + ";")

            connection.commit()
            print("データベースとテーブルの作成が完了しました")

    except Error as e:
        print(f"エラーが発生しました: {e}")

    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()
            print("データベースとの接続を閉じました")


if __name__ == "__main__":
    setup_database()
