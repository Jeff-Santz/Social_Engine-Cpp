#ifndef DATABASE_H
#define DATABASE_H

#include <string>
#include <vector>
#include <functional>
#include <memory>
#include <sqlite3.h> 
#include <mutex>

namespace Core {

    struct SqliteCloser {
        void operator()(sqlite3* p) const { sqlite3_close(p); }
    };

    class Database {
    private:
        std::unique_ptr<sqlite3, SqliteCloser> db;
        static std::unique_ptr<Database> instance;
        std::mutex dbMutex;
        Database(); // (Singleton)
        friend std::unique_ptr<Database> std::make_unique<Database>();
    
    public:
        ~Database();
        static Database* getInstance();
        bool execute(const std::string& sql);
        using QueryCallback = std::function<int(int, char**, char**)>;
        bool query(const std::string& sql, QueryCallback callback);
        int getLastInsertId();
        static std::string escape(const std::string& input);
    };
}

#endif